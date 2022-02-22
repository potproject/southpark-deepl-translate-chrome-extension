document.getElementById("save_button")!.addEventListener("click", save);

function save() {
    // @ts-ignore
    const form = document.form;
    const api_type = form.deepl_api_type.value;
    const deepl_auth = form.deepl_auth.value;
    const deepl_target = form.deepl_target.value;
    
    chrome.storage.local.set({
        api_type: api_type,
        deepl_auth: deepl_auth,
        deepl_target: deepl_target
    }, function() {
        const message = document.getElementById("message_text");
        message!.textContent = "Saved!";
    });
}

async function init(){
    const storage = await chrome.storage.local.get(["api_type", "deepl_auth", "deepl_target"]);
    // @ts-ignore
    const form = document.form;
    form.deepl_api_type.value = storage.api_type;
    form.deepl_auth.value = storage.deepl_auth;
    form.deepl_target.value = storage.deepl_target;
}
init();