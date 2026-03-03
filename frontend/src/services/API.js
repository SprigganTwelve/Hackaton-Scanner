const BASE_URL = import.meta.env.VITE_API_URL || "";

function buildURL(path,query){
    const URL = new URL(path, BASE_URL)
    if (query && typeof query === "object") {
        Object.entries(query).forEach(([k, v]) => {
        if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
        });
    }
    return url.toString();
}
async function request(path, options = {}) {
    const {
        method = "GET",
        headers,
        query,
        body,
        timeoutMs = 60000,
    } = options;
    const controller = new AbortController()
    const timeOutId = setTimeout(()=>controller.abort(),timeoutMs)
    const finalHeaders = {
        Accept: "application/json",
        ...headers,
    };

    let finalBody = body
    const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
        if (body && typeof body === "object" && !isFormData && !(body instanceof Blob)) {
            finalHeaders["Content-Type"] = "application/json";
            finalBody = JSON.stringify(body);
        }
    
    try{
        const res = await fetch(buildURL(path, query), {
            method,
            headers: finalHeaders,
            body: method === "GET" || method === "HEAD" ? undefined : finalBody,
            signal: controller.signal,
        });

        const contentType = res.headers.get("content-type") || "";
        const isJson = contentType.includes("application/json");
        const data = isJson ? await res.json().catch(() => null) : await res.text().catch(() => null);
        if (!res.ok) {
            const error = new Error(`HTTP ${res.status}`);
            error.status = res.status;
            error.data = data;
            throw error;
        }
        return data;
    } finally{
        clearTimeout(timeOutId)
    }
}
export const API = {
    get:(path, opts) => request(path, {...opts, method :"GET"})
}


