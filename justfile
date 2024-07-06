update:
    cd src-tauri; cargo update aah-core
    cd src-tauri; cargo clean -p aah-core
    cd src-tauri; cargo check
doc:
    cd src-tauri; cargo doc -p aah-core --open