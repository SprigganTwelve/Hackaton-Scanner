const BASE_URL = import.meta.env.VITE_API_URL || window.location.origin;

function buildUrl(path, query) {
  // IMPORTANT: ne pas appeler une variable "URL" (ça masque window.URL)
  const urlObj = /^https?:\/\//i.test(path)
    ? new window.URL(path)
    : new window.URL(path, BASE_URL);

  if (query && typeof query === "object") {
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null) urlObj.searchParams.set(k, String(v));
    });
  }

  return urlObj.toString();
}

async function request(path, options = {}) {
	const {
		method = "GET",
		headers = {},
		query,
		body,
		timeoutMs = 60000,
	} = options;

	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

	const finalHeaders = {
		Accept: "application/json",
		...headers,
	};

	let finalBody = body;

	const isFormData =
		typeof FormData !== "undefined" && body instanceof FormData;

	if (
		body &&
		typeof body === "object" &&
		!isFormData &&
		!(body instanceof Blob)
	) {
		finalHeaders["Content-Type"] = "application/json";
		finalBody = JSON.stringify(body);
	}

  	const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
	if (token) {
		finalHeaders.Authorization = `Bearer ${token}`;
	}

	try {
		const res = await fetch(buildUrl(path, query), {
		method,
		headers: finalHeaders,
		body: method === "GET" || method === "HEAD" ? undefined : finalBody,
		signal: controller.signal,
		});

		const contentType = res.headers.get("content-type") || "";
		const isJson = contentType.includes("application/json");

		const data = isJson
		? await res.json().catch(() => null)
		: await res.text().catch(() => null);

		if (!res.ok) {
		const error = new Error(`HTTP ${res.status}`);
		error.status = res.status;
		error.data = data;
		throw error;
		}

		return data;
	} finally {
		clearTimeout(timeoutId);
	}
}

export const api = {
  get: (path, opts) => request(path, { ...opts, method: "GET" }),
  post: (path, body, opts) => request(path, { ...opts, method: "POST", body }),
  put: (path, body, opts) => request(path, { ...opts, method: "PUT", body }),
  patch: (path, body, opts) => request(path, { ...opts, method: "PATCH", body }),
  del: (path, opts) => request(path, { ...opts, method: "DELETE" }),

//   upload: (path, formData, opts) =>
//     request(path, { ...opts, method: "POST", body: formData }),
};


