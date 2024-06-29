use std::sync::{ Mutex, OnceLock};

use aah_core::AAH;

pub fn core_instance() -> &'static Mutex<Option<AAH>> {
    static RECORDS: OnceLock<Mutex<Option<AAH>>> = OnceLock::new();
    RECORDS.get_or_init(|| Mutex::new(None))
}