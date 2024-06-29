use std::{cell::OnceCell, sync::Mutex};

use aah_core::AAH;

pub fn core_instance() -> &'static Mutex<Option<AAH>> {
    static RECORDS: OnceLock<Mutex<Option<AAH>>> = OnceLock::new();
    RECORDS.get_or_init(|| Mutex::new(None))
}