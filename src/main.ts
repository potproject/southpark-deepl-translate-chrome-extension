document.getElementById("save_button")!.addEventListener("click", save);
document.getElementById("check_button")!.addEventListener("click", checkDeeplLimit);

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
    }, function () {
        const message = document.getElementById("message_text");
        message!.textContent = "Saved!";
    });
}

const deeplUsageEndpoint = {
    "free": "https://api-free.deepl.com/v2/usage",
    "pro": "https://api.deepl.com/v2/usage",
};

async function checkDeeplLimit() {
    // @ts-ignore
    const form = document.form;
    const api_type = form.deepl_api_type.value as "free" | "pro" | undefined | null;
    const deepl_auth = form.deepl_auth.value;
    if (!api_type || !deepl_auth) {
        return;
    }
    let formData = new FormData();
    formData.append('auth_key', deepl_auth);
    const results = await fetch(deeplUsageEndpoint[api_type], {
        method: 'post',
        body: formData,
    }).then(res => {
        if (res.status === 403) {
            throw new Error("Authentication failure");
        }
        return res.json();
    });
    document.getElementById("deepl_usage")!.textContent = ` Deepl API Usage: ${results.character_count} / ${results.character_limit}`;
}

async function init() {
    const storage = await chrome.storage.local.get(["api_type", "deepl_auth", "deepl_target"]);
    // @ts-ignore
    const form = document.form;
    form.deepl_api_type.value = storage.api_type ?? "free";
    form.deepl_auth.value = storage.deepl_auth ?? "";
    form.deepl_target.value = storage.deepl_target ?? "";
}
init();