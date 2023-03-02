use std::path::PathBuf;

use serde::{Deserialize, Serialize};

pub struct NodeDescription {
    pub choice: String,
    pub list: String,
    pub terminal: String,
    pub regex: String,
}

#[derive(Serialize, Deserialize)]
pub struct Impl {
    pub loc: PathBuf,
    pub applies_to: Vec<String>,
}

#[derive(Serialize, Deserialize)]
pub struct Config {
    pub choice: Vec<Impl>,
    pub list: Vec<Impl>,
    pub terminal: Vec<Impl>,
    pub regex: Vec<Impl>,
    pub dest: PathBuf,
    pub start: String,
    pub grammar: String,
}
