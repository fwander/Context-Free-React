extern crate ebnf;
use serde_json;
use templates::render_all;
use std::env;
use std::fs;

mod config;
mod templates;


fn main() {
    let mut args = env::args();
    let _ = args.next().expect("no 0th arguemtn");
    let config = args.next().expect("no config file specified");

    let contents = fs::read_to_string(config).unwrap();
    let config: config::Config = serde_json::from_str(&contents).unwrap();

    render_all(config);

}
