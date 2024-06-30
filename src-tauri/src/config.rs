// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::{fs, path::Path, collections::HashMap};
use serde::{Serialize, Deserialize};
use std::sync::{Mutex, OnceLock};

use aah_core::AAH;

// State management for core instance
pub fn core_instance() -> &'static Mutex<Option<AAH>> {
    static RECORDS: OnceLock<Mutex<Option<AAH>>> = OnceLock::new();
    RECORDS.get_or_init(|| Mutex::new(None))
}

// Define the Config struct and related functionality
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Config {
    pub name: String,
    pub version: String,
    #[serde(default)]
    pub jvm_options: String,
    #[serde(default)]
    pub properties: HashMap<String, String>,
    #[serde(default)]
    pub mods: HashMap<String, String> // slug -> version_number
}

impl Config {
    pub fn new(name: String, version: String) -> Self {
        Self { name, version, jvm_options: String::new(), properties: HashMap::new(), mods: HashMap::new() }
    }

    pub fn load<P: AsRef<Path>>(path: P) -> Result<Self, String> {
        let config = fs::read_to_string(path).map_err(|err| format!("failed to read config file: {:?}", err))?;
        let config = toml::from_str::<Config>(&config).map_err(|err| format!("failed to parse config: {:?}", err))?;
        // TODO: check server version
        Ok(config)
    }
}

// Testing module for Config struct
#[cfg(test)]
mod test {
    use super::*;

    #[test]
    fn test_new_config() {
        let config = Config::new("name".to_string(), "version".to_string());
        let toml = toml::to_string(&config).unwrap();
        println!("{toml}");
        let toml = toml::to_string_pretty(&config).unwrap();
        println!("{toml}");
    }
}
