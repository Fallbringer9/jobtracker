import { loadConfig } from "./js/config";
import { startLogin, exchangeCodeForTokens } from "./js/auth";
import "./css/styles.css";
import { getApplications, patchApplication, deleteApplication, createApplication, AuthExpiredError } from "./js/api";
import { renderBoard, bindBoardEvents } from "./js/ui";


function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function clearCodeFromUrl() {
  const url = new URL(window.location.href);
  url.searchParams.delete("code");
  url.searchParams.delete("state");
  window.history.replaceState({}, "", url.toString());
}

async function main() {
  const config = await loadConfig();
  const root = document.querySelector("#app");

  function showLoading(message = "Chargement du board…") {
    root.innerHTML = `
      <div style="min-height:100vh; display:flex; align-items:center; justify-content:center; padding:24px; font-family:system-ui; background:#0b0e14; color: rgba(255,255,255,0.85);">
        <div style="padding:16px 18px; border-radius:16px; border:1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.06);">${message}</div>
      </div>
    `;
  }

  function handleAuthExpired(err) {
    if (err && (err.name === "AuthExpiredError" || err instanceof AuthExpiredError)) {
      sessionStorage.removeItem("id_token");
      sessionStorage.removeItem("access_token");
      startLogin(config);
      return true;
    }
    return false;
  }

  const code = getQueryParam("code");
  const existingToken = sessionStorage.getItem("id_token");
  if (!code && existingToken) {
    showLoading("Chargement du board…");
    let data;
    try {
      data = await getApplications(config, existingToken);
    } catch (err) {
      if (handleAuthExpired(err)) return;
      console.error(err);
      showLoading("Erreur lors du chargement.");
      return;
    }
    renderBoard(root, data.items);
    const handlers = {
      onLogout: () => {
        sessionStorage.clear();
        window.location.reload();
      },
      onPatchStatus: async (applicationId, payload) => {
        try {
          const token = sessionStorage.getItem("id_token");
          await patchApplication(config, token, applicationId, payload);
          const refreshed = await getApplications(config, token);
          renderBoard(root, refreshed.items);
          bindBoardEvents(root, refreshed.items, handlers);
          root.setGlobalError && root.setGlobalError("");
        } catch (err) {
          if (handleAuthExpired(err)) return;
          root.setGlobalError && root.setGlobalError(err?.message || "Erreur API");
          console.error(err);
        }
      },
      onUpdate: async (applicationId, payload) => {
        try {
          const token = sessionStorage.getItem("id_token");
          await patchApplication(config, token, applicationId, payload);
          const refreshed = await getApplications(config, token);
          renderBoard(root, refreshed.items);
          bindBoardEvents(root, refreshed.items, handlers);
          root.setGlobalError && root.setGlobalError("");
        } catch (err) {
          if (handleAuthExpired(err)) return;
          root.setGlobalError && root.setGlobalError(err?.message || "Erreur API");
          console.error(err);
        }
      },
      onDelete: async (applicationId) => {
        try {
          const token = sessionStorage.getItem("id_token");
          await deleteApplication(config, token, applicationId);
          const refreshed = await getApplications(config, token);
          renderBoard(root, refreshed.items);
          bindBoardEvents(root, refreshed.items, handlers);
          root.setGlobalError && root.setGlobalError("");
        } catch (err) {
          if (handleAuthExpired(err)) return;
          root.setGlobalError && root.setGlobalError(err?.message || "Erreur API");
          console.error(err);
        }
      },
      onCreate: async (payload) => {
        try {
          const token = sessionStorage.getItem("id_token");
          await createApplication(config, token, payload);
          const refreshed = await getApplications(config, token);
          renderBoard(root, refreshed.items);
          bindBoardEvents(root, refreshed.items, handlers);
          root.setGlobalError && root.setGlobalError("");
        } catch (err) {
          if (handleAuthExpired(err)) return;
          root.setGlobalError && root.setGlobalError(err?.message || "Erreur API");
          console.error(err);
        }
      },
    };

    bindBoardEvents(root, data.items, handlers);
    root.setGlobalError && root.setGlobalError("");
    return;
  }

  if (code) {
    showLoading("Connexion… 🔐");

    let tokens;
    try {
      tokens = await exchangeCodeForTokens(config, code);
    } catch (err) {
      const msg = String(err?.message || "");
      // When redirect_uri/origin changes (CloudFront -> custom domain), the PKCE verifier stored in sessionStorage
      // may be missing. In that case, restart the login flow cleanly.
      if (msg.toLowerCase().includes("pkce") || msg.toLowerCase().includes("verifier")) {
        console.error(err);
        showLoading("Session de connexion expirée. Relance de la connexion…");
        // remove the code from the URL so we don't loop on the same failing exchange
        clearCodeFromUrl();
        // defensive cleanup
        sessionStorage.removeItem("pkce_code_verifier");
        sessionStorage.removeItem("pkce_verifier");
        sessionStorage.removeItem("id_token");
        sessionStorage.removeItem("access_token");
        startLogin(config);
        return;
      }
      throw err;
    }

    sessionStorage.setItem("id_token", tokens.id_token || "");
    sessionStorage.setItem("access_token", tokens.access_token || "");

    clearCodeFromUrl();

    const idToken = sessionStorage.getItem("id_token");
    showLoading("Chargement du board…");

    let data;
    try {
      data = await getApplications(config, idToken);
    } catch (err) {
      if (handleAuthExpired(err)) return;
      console.error(err);
      showLoading("Erreur lors du chargement.");
      return;
    }

    renderBoard(root, data.items);
    const handlers = {
      onLogout: () => {
        sessionStorage.clear();
        window.location.reload();
      },
      onPatchStatus: async (applicationId, payload) => {
        try {
          const token = sessionStorage.getItem("id_token");
          await patchApplication(config, token, applicationId, payload);
          const refreshed = await getApplications(config, token);
          renderBoard(root, refreshed.items);
          bindBoardEvents(root, refreshed.items, handlers);
          root.setGlobalError && root.setGlobalError("");
        } catch (err) {
          if (handleAuthExpired(err)) return;
          root.setGlobalError && root.setGlobalError(err?.message || "Erreur API");
          console.error(err);
        }
      },
      onUpdate: async (applicationId, payload) => {
        try {
          const token = sessionStorage.getItem("id_token");
          await patchApplication(config, token, applicationId, payload);
          const refreshed = await getApplications(config, token);
          renderBoard(root, refreshed.items);
          bindBoardEvents(root, refreshed.items, handlers);
          root.setGlobalError && root.setGlobalError("");
        } catch (err) {
          if (handleAuthExpired(err)) return;
          root.setGlobalError && root.setGlobalError(err?.message || "Erreur API");
          console.error(err);
        }
      },
      onDelete: async (applicationId) => {
        try {
          const token = sessionStorage.getItem("id_token");
          await deleteApplication(config, token, applicationId);
          const refreshed = await getApplications(config, token);
          renderBoard(root, refreshed.items);
          bindBoardEvents(root, refreshed.items, handlers);
          root.setGlobalError && root.setGlobalError("");
        } catch (err) {
          if (handleAuthExpired(err)) return;
          root.setGlobalError && root.setGlobalError(err?.message || "Erreur API");
          console.error(err);
        }
      },
      onCreate: async (payload) => {
        try {
          const token = sessionStorage.getItem("id_token");
          await createApplication(config, token, payload);
          const refreshed = await getApplications(config, token);
          renderBoard(root, refreshed.items);
          bindBoardEvents(root, refreshed.items, handlers);
          root.setGlobalError && root.setGlobalError("");
        } catch (err) {
          if (handleAuthExpired(err)) return;
          root.setGlobalError && root.setGlobalError(err?.message || "Erreur API");
          console.error(err);
        }
      },
    };

    bindBoardEvents(root, data.items, handlers);
    root.setGlobalError && root.setGlobalError("");
    return;
  }
  root.innerHTML = `
    <div style="min-height:100vh; display:flex; align-items:center; justify-content:center; padding:24px; font-family:system-ui; background: radial-gradient(1200px 600px at 20% 10%, rgba(255,255,255,0.10), rgba(0,0,0,0)), radial-gradient(900px 500px at 85% 30%, rgba(255,255,255,0.06), rgba(0,0,0,0)), #0b0e14; color: rgba(255,255,255,0.92);">
      <div style="width:min(920px, 100%); display:grid; gap:18px; grid-template-columns: 1.05fr 0.95fr; align-items:stretch;">
        <div style="padding:22px 22px 18px; border-radius:20px; border:1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.06); backdrop-filter: blur(10px);">
          <div style="font-weight:900; font-size:28px; letter-spacing:-0.02em;">JobTracker</div>
          <div style="margin-top:10px; font-size:14px; color: rgba(255,255,255,0.70); line-height:1.5;">
            Ton board minimaliste pour suivre tes candidatures.
            <br />
            Auth sécurisé (Cognito) + API serverless (Lambda/Dynamo).
          </div>

          <div style="margin-top:18px; display:flex; gap:10px; flex-wrap:wrap;">
            <div style="padding:10px 12px; border-radius:14px; background: rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.10); font-size:12px; color: rgba(255,255,255,0.80);">🔐 Connexion sécurisée</div>
            <div style="padding:10px 12px; border-radius:14px; background: rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.10); font-size:12px; color: rgba(255,255,255,0.80);">⚡ Ultra rapide</div>
            <div style="padding:10px 12px; border-radius:14px; background: rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.10); font-size:12px; color: rgba(255,255,255,0.80);">☁️ Cloud-ready</div>
          </div>

          <div style="margin-top:18px; font-size:12px; color: rgba(255,255,255,0.55);">
            Conseil: utilise un compte test Cognito pour tes démos.
          </div>
        </div>

        <div style="padding:22px; border-radius:20px; border:1px solid rgba(255,255,255,0.12); background: rgba(15,18,24,0.92); backdrop-filter: blur(10px); display:flex; flex-direction:column; justify-content:center; gap:14px;">
          <div style="font-weight:800; font-size:16px;">Connexion</div>
          <div style="font-size:13px; color: rgba(255,255,255,0.65); line-height:1.5;">
            Clique sur le bouton pour te connecter via Cognito.
          </div>

          <button id="loginBtn" style="width:100%; padding:12px 14px; border-radius:14px; cursor:pointer; border:1px solid rgba(255,255,255,0.16); background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.92); font-weight:700;">
            Se connecter
          </button>

          <div style="font-size:12px; color: rgba(255,255,255,0.55);">
            Tu seras redirigé vers la page de connexion Cognito.
          </div>
        </div>
      </div>
    </div>
  `;

  document.querySelector("#loginBtn").addEventListener("click", () => startLogin(config));
}

main().catch((err) => {
  console.error(err);
  document.querySelector("#app").innerHTML = `<pre style="color:red;padding:16px;">${err.message}</pre>`;
});
