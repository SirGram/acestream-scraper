import json
import os
import tempfile
import pytest
from pathlib import Path
from unittest.mock import patch, MagicMock
from app.utils.config import Config


class TestConfig:
    
    @pytest.fixture
    def reset_config(self):
        """Reset Config singleton before each test."""
        saved_instance = Config._instance
        Config._instance = None
        Config.config_path = None
        Config.database_path = None
        yield
        Config._instance = saved_instance
    
    @pytest.fixture
    def mock_settings_repo(self):
        mock_repo = MagicMock()
        mock_repo.get_setting.return_value = None
        mock_repo.get_all_settings.return_value = {'base_url': 'acestream://', 'ace_engine_url': 'http://localhost:8080'}
        return mock_repo
    
    @pytest.fixture
    def config_file(self):
        # Create a temporary config file
        config_data = {
            'base_url': 'acestream://',
            'channel_base_url': 'acestream://',
            'ace_engine_url': 'http://localhost:6878',
            'rescrape_interval': 24
        }
        
        with tempfile.NamedTemporaryFile(delete=False, mode='w') as f:
            json.dump(config_data, f)
            temp_path = f.name
            
        yield temp_path
        
        # Cleanup
        if os.path.exists(temp_path):
            os.unlink(temp_path)
    
    def test_init_with_config_file(self, reset_config, config_file, mock_settings_repo, app_context):
        with patch('app.utils.config.SettingsRepository', return_value=mock_settings_repo):
            # Set the config path explicitly before creating instance
            Config.config_path = Path(config_file)
            config = Config()
            # Verify config loaded from file has content
            assert config._config and len(config._config) > 0
    
    def test_init_without_config_file(self, reset_config, mock_settings_repo, app_context):
        with patch('app.utils.config.SettingsRepository', return_value=mock_settings_repo):
            # Use a non-existent path
            Config.config_path = Path('/path/does/not/exist.json')
            config = Config()
            assert config._config == {}
    
    def test_get_from_database(self, reset_config, mock_settings_repo, app_context):
        mock_settings_repo.get_setting.return_value = 'database_value'
        
        with patch('app.utils.config.SettingsRepository', return_value=mock_settings_repo):
            config = Config()
            value = config.get('test_key')
            
            assert value == 'database_value'
            mock_settings_repo.get_setting.assert_called_once_with('test_key')
    
    def test_get_fallback_to_file(self, reset_config, config_file, mock_settings_repo, app_context):
        mock_settings_repo.get_setting.return_value = None
        
        with patch('app.utils.config.SettingsRepository', return_value=mock_settings_repo):
            Config.config_path = Path(config_file)
            config = Config()
            value = config.get('rescrape_interval')
            
            assert value == 24
    
    def test_get_with_default(self, reset_config, mock_settings_repo, app_context):
        mock_settings_repo.get_setting.return_value = None
        
        with patch('app.utils.config.SettingsRepository', return_value=mock_settings_repo):
            config = Config()
            value = config.get('non_existent_key', 'default_value')
            
            assert value == 'default_value'
    
    def test_set(self, reset_config, mock_settings_repo, app_context):
        with patch('app.utils.config.SettingsRepository', return_value=mock_settings_repo):
            config = Config()
            config.set('test_key', 'test_value')
            
            mock_settings_repo.set_setting.assert_called_once_with('test_key', 'test_value')
    
    def test_save(self, reset_config, config_file, mock_settings_repo, app_context):
        with patch('app.utils.config.SettingsRepository', return_value=mock_settings_repo):
            Config.config_path = Path(config_file)
            config = Config()
            config.save()
            
            # Read the file back
            with open(config_file, 'r') as f:
                saved_config = json.load(f)
            
            # Should have merged database settings into file
            assert saved_config['base_url'] == 'acestream://'
            assert saved_config['channel_base_url'] == 'acestream://'
            assert saved_config['ace_engine_url'] == 'http://localhost:8080'
    
    def test_migrate_to_database(self, reset_config, config_file, mock_settings_repo, app_context):
        with patch('app.utils.config.SettingsRepository', return_value=mock_settings_repo):
            Config.config_path = Path(config_file)
            config = Config()
            result = config.migrate_to_database()
            
            assert result is True
            # Check that set_setting was called the right number of times
            assert mock_settings_repo.set_setting.call_count == 3  # For the 3 keys in our test config
