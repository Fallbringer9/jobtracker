function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(isoDate) {
  if (!isoDate) return "";

  const [y, m, d] = String(isoDate).split("-");
  if (!y || !m || !d) return escapeHtml(isoDate);
  return `${d}-${m}-${y}`;
}

function cardHtml(app) {
  return `
    <article class="card" data-id="${escapeHtml(app.applicationId)}">
      <h4>${escapeHtml(app.title)}</h4>
      <div class="meta">
        <span>${escapeHtml(app.location)}</span>
        <span>${escapeHtml(formatDate(app.appliedDate))}</span>
        <span>${escapeHtml(app.company)}</span>
      </div>
    </article>
  `;
}

function splitByStatus(items) {
  const left = [];  // IN_PROGRESS
  const mid = [];   // ACCEPTED
  const right = []; // CLOSED (REFUSED/ABANDONED ou CLOSED)

  for (const it of items || []) {
    const s = it.status;
    if (s === "IN_PROGRESS") left.push(it);
    else if (s === "ACCEPTED") mid.push(it);
    else right.push(it);
  }

  return { left, mid, right };
}

export function renderBoard(root, items) {
  const { left, mid, right } = splitByStatus(items);

  root.innerHTML = `
    <div class="app">
      <div class="topbar">
        <div class="brand">
          <div class="brand-badge">JT</div>
          <div class="brand-title">
            <strong>JobTracker</strong>
            <span>Board</span>
          </div>
        </div>
        <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap; justify-content:flex-end;">
          <button class="btn" id="newAppBtn">+ Nouvelle</button>
          <div class="pill">Connecté ✅</div>
          <button class="btn" id="logoutBtn">Déconnexion</button>
        </div>
      </div>

      <div class="shell">
        <div id="globalError" style="display:none; margin: 0 0 12px; padding:12px 14px; border-radius:14px; border:1px solid rgba(255,255,255,0.14); background: rgba(255,120,120,0.10); color: rgba(255,180,180,0.95); font-size:12px;">
          Erreur.
        </div>
        <div style="width:100%; overflow-x:auto; padding-bottom:10px; -webkit-overflow-scrolling: touch; scroll-snap-type: x mandatory;">
          <div class="board" style="display:flex; gap:14px; min-width:max-content; scroll-snap-type: x mandatory;">

          <section class="column left" style="flex:1; min-width:320px; scroll-snap-align:start;">
            <div class="column-header">
              <div class="column-title">En cours</div>
              <div class="pill">${left.length}</div>
            </div>
            <div class="column-body" id="col-left">
              ${left.length ? left.map(cardHtml).join("") : `<div style="padding:12px; color: rgba(255,255,255,0.60); font-size:12px; border:1px dashed rgba(255,255,255,0.16); border-radius:14px; background: rgba(255,255,255,0.03);">Aucune candidature en cours.</div>`}
            </div>
          </section>

          <section class="column mid" style="flex:1; min-width:320px; scroll-snap-align:start;">
            <div class="column-header">
              <div class="column-title">Accepté</div>
              <div class="pill">${mid.length}</div>
            </div>
            <div class="column-body" id="col-mid">
              ${mid.length ? mid.map(cardHtml).join("") : `<div style="padding:12px; color: rgba(255,255,255,0.60); font-size:12px; border:1px dashed rgba(255,255,255,0.16); border-radius:14px; background: rgba(255,255,255,0.03);">Aucun job accepté pour l’instant.</div>`}
            </div>
          </section>

          <section class="column right" style="flex:1; min-width:320px; scroll-snap-align:start;">
            <div class="column-header">
              <div class="column-title">Clôturé</div>
              <div class="pill">${right.length}</div>
            </div>
            <div class="column-body" id="col-right">
              ${right.length ? right.map(cardHtml).join("") : `<div style="padding:12px; color: rgba(255,255,255,0.60); font-size:12px; border:1px dashed rgba(255,255,255,0.16); border-radius:14px; background: rgba(255,255,255,0.03);">Aucune candidature clôturée.</div>`}
            </div>
          </section>

          </div>
        </div>
      </div>
      <div id="modalBackdrop" style="display:none; position:fixed; inset:0; background: rgba(0,0,0,0.55); backdrop-filter: blur(6px);">
        <div style="max-width:min(640px, 92vw); margin: 7vh auto; background: rgba(15,18,24,0.92); border: 1px solid rgba(255,255,255,0.14); border-radius: 18px; overflow:hidden;">
          <div style="display:flex; justify-content:space-between; align-items:center; padding:14px 14px 10px;">
            <div>
              <div id="modalTitle" style="font-weight:700; font-size:16px;">Titre</div>
              <div id="modalSub" style="color: rgba(255,255,255,0.65); font-size:12px; margin-top:4px;">Sous-titre</div>
            </div>
            <button class="btn" id="closeModalBtn">Fermer</button>
          </div>
          <div style="padding: 0 14px 14px;">
            <div id="modalBody" style="display:grid; gap:10px;"></div>

            <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:12px;">
              <button class="btn" id="btnEdit">Modifier</button>
              <button class="btn" id="btnStatusInProgress">En cours</button>
              <button class="btn" id="btnStatusAccepted">Accepté</button>
              <button class="btn" id="btnStatusRefused">Refus</button>
              <button class="btn" id="btnStatusAbandoned">Abandon</button>
              <button class="btn" id="btnDelete" style="border-color: rgba(255,255,255,0.20);">Supprimer</button>
            </div>

            <div id="modalError" style="display:none; margin-top:10px; color: rgba(255,140,140,0.95); font-size:12px;"></div>
          </div>
        </div>
      </div>
      <div id="confirmBackdrop" style="display:none; position:fixed; inset:0; background: rgba(0,0,0,0.55); backdrop-filter: blur(6px);">
        <div style="max-width:min(520px, 92vw); margin: 18vh auto; background: rgba(15,18,24,0.94); border: 1px solid rgba(255,255,255,0.14); border-radius: 18px; overflow:hidden;">
          <div style="padding:14px 14px 6px;">
            <div style="font-weight:800; font-size:16px;">Supprimer la candidature ?</div>
            <div style="color: rgba(255,255,255,0.65); font-size:12px; margin-top:6px;">Cette action est définitive.</div>
          </div>
          <div style="padding: 10px 14px 14px; display:flex; gap:10px; justify-content:flex-end;">
            <button class="btn" id="confirmCancelBtn">Annuler</button>
            <button class="btn" id="confirmDeleteBtn" style="border-color: rgba(255,255,255,0.22);">Supprimer</button>
          </div>
          <div id="confirmError" style="display:none; padding: 0 14px 14px; color: rgba(255,140,140,0.95); font-size:12px;"></div>
        </div>
      </div>
      <div id="createBackdrop" style="display:none; position:fixed; inset:0; background: rgba(0,0,0,0.55); backdrop-filter: blur(6px);">
        <div style="max-width:min(720px, 92vw); margin: 7vh auto; background: rgba(15,18,24,0.94); border: 1px solid rgba(255,255,255,0.14); border-radius: 18px; overflow:hidden;">
          <div style="display:flex; justify-content:space-between; align-items:center; padding:14px 14px 10px;">
            <div>
              <div style="font-weight:800; font-size:16px;">Nouvelle candidature</div>
              <div style="color: rgba(255,255,255,0.65); font-size:12px; margin-top:4px;">Champs essentiels, le reste est optionnel.</div>
            </div>
            <button class="btn" id="closeCreateBtn">Fermer</button>
          </div>

          <div style="padding: 0 14px 14px;">
            <form id="createForm" style="display:grid; gap:10px;">
              <div style="display:grid; gap:8px; grid-template-columns: 1fr 1fr;">
                <label style="display:grid; gap:6px;">
                  <span style="font-size:12px; color: rgba(255,255,255,0.65);">Poste *</span>
                  <input id="c_title" placeholder="Cloud Developer" style="padding:10px 12px; border-radius:12px; border:1px solid rgba(255,255,255,0.14); background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.92);" />
                </label>
                <label style="display:grid; gap:6px;">
                  <span style="font-size:12px; color: rgba(255,255,255,0.65);">Entreprise *</span>
                  <input id="c_company" placeholder="ACME" style="padding:10px 12px; border-radius:12px; border:1px solid rgba(255,255,255,0.14); background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.92);" />
                </label>
              </div>

              <div style="display:grid; gap:8px; grid-template-columns: 1fr 1fr;">
                <label style="display:grid; gap:6px;">
                  <span style="font-size:12px; color: rgba(255,255,255,0.65);">Lieu *</span>
                  <input id="c_location" placeholder="Paris" style="padding:10px 12px; border-radius:12px; border:1px solid rgba(255,255,255,0.14); background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.92);" />
                </label>
                <label style="display:grid; gap:6px;">
                  <span style="font-size:12px; color: rgba(255,255,255,0.65);">Date de candidature *</span>
                  <input id="c_appliedDate" type="date" style="padding:10px 12px; border-radius:12px; border:1px solid rgba(255,255,255,0.14); background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.92);" />
                </label>
              </div>

              <label style="display:grid; gap:6px;">
                <span style="font-size:12px; color: rgba(255,255,255,0.65);">Lien annonce</span>
                <input id="c_jobUrl" placeholder="https://..." style="padding:10px 12px; border-radius:12px; border:1px solid rgba(255,255,255,0.14); background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.92);" />
              </label>

              <div style="display:grid; gap:8px; grid-template-columns: 1fr 1fr;">
                <label style="display:grid; gap:6px;">
                  <span style="font-size:12px; color: rgba(255,255,255,0.65);">Contact</span>
                  <input id="c_contact" placeholder="recruteur@..." style="padding:10px 12px; border-radius:12px; border:1px solid rgba(255,255,255,0.14); background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.92);" />
                </label>
                <label style="display:grid; gap:6px;">
                  <span style="font-size:12px; color: rgba(255,255,255,0.65);">Statut</span>
                  <select id="c_status" style="padding:10px 12px; border-radius:12px; border:1px solid rgba(255,255,255,0.14); background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.92);">
                    <option value="IN_PROGRESS">En cours</option>
                    <option value="ACCEPTED">Accepté</option>
                    <option value="CLOSED">Clôturé</option>
                  </select>
                </label>
              </div>

              <label style="display:grid; gap:6px;">
                <span style="font-size:12px; color: rgba(255,255,255,0.65);">Mission</span>
                <textarea id="c_mission" rows="3" style="padding:10px 12px; border-radius:12px; border:1px solid rgba(255,255,255,0.14); background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.92); resize:vertical;"></textarea>
              </label>

              <label style="display:grid; gap:6px;">
                <span style="font-size:12px; color: rgba(255,255,255,0.65);">Notes</span>
                <textarea id="c_notes" rows="3" style="padding:10px 12px; border-radius:12px; border:1px solid rgba(255,255,255,0.14); background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.92); resize:vertical;"></textarea>
              </label>

              <div id="createError" style="display:none; color: rgba(255,140,140,0.95); font-size:12px;"></div>

              <div style="display:flex; gap:10px; justify-content:flex-end;">
                <button class="btn" type="button" id="createCancelBtn">Annuler</button>
                <button class="btn" type="submit" id="createSubmitBtn" style="border-color: rgba(255,255,255,0.22);">Créer</button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <div id="editBackdrop" style="display:none; position:fixed; inset:0; background: rgba(0,0,0,0.55); backdrop-filter: blur(6px);">
        <div style="max-width:min(720px, 92vw); margin: 7vh auto; background: rgba(15,18,24,0.94); border: 1px solid rgba(255,255,255,0.14); border-radius: 18px; overflow:hidden;">
          <div style="display:flex; justify-content:space-between; align-items:center; padding:14px 14px 10px;">
            <div>
              <div style="font-weight:800; font-size:16px;">Modifier la candidature</div>
              <div style="color: rgba(255,255,255,0.65); font-size:12px; margin-top:4px;">Mets à jour les champs, puis enregistre.</div>
            </div>
            <button class="btn" id="closeEditBtn">Fermer</button>
          </div>

          <div style="padding: 0 14px 14px;">
            <form id="editForm" style="display:grid; gap:10px;">
              <div style="display:grid; gap:8px; grid-template-columns: 1fr 1fr;">
                <label style="display:grid; gap:6px;">
                  <span style="font-size:12px; color: rgba(255,255,255,0.65);">Poste *</span>
                  <input id="e_title" placeholder="Cloud Developer" style="padding:10px 12px; border-radius:12px; border:1px solid rgba(255,255,255,0.14); background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.92);" />
                </label>
                <label style="display:grid; gap:6px;">
                  <span style="font-size:12px; color: rgba(255,255,255,0.65);">Entreprise *</span>
                  <input id="e_company" placeholder="ACME" style="padding:10px 12px; border-radius:12px; border:1px solid rgba(255,255,255,0.14); background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.92);" />
                </label>
              </div>

              <div style="display:grid; gap:8px; grid-template-columns: 1fr 1fr;">
                <label style="display:grid; gap:6px;">
                  <span style="font-size:12px; color: rgba(255,255,255,0.65);">Lieu *</span>
                  <input id="e_location" placeholder="Paris" style="padding:10px 12px; border-radius:12px; border:1px solid rgba(255,255,255,0.14); background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.92);" />
                </label>
                <label style="display:grid; gap:6px;">
                  <span style="font-size:12px; color: rgba(255,255,255,0.65);">Date de candidature *</span>
                  <input id="e_appliedDate" type="date" style="padding:10px 12px; border-radius:12px; border:1px solid rgba(255,255,255,0.14); background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.92);" />
                </label>
              </div>

              <label style="display:grid; gap:6px;">
                <span style="font-size:12px; color: rgba(255,255,255,0.65);">Lien annonce</span>
                <input id="e_jobUrl" placeholder="https://..." style="padding:10px 12px; border-radius:12px; border:1px solid rgba(255,255,255,0.14); background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.92);" />
              </label>

              <label style="display:grid; gap:6px;">
                <span style="font-size:12px; color: rgba(255,255,255,0.65);">Contact</span>
                <input id="e_contact" placeholder="recruteur@..." style="padding:10px 12px; border-radius:12px; border:1px solid rgba(255,255,255,0.14); background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.92);" />
              </label>

              <label style="display:grid; gap:6px;">
                <span style="font-size:12px; color: rgba(255,255,255,0.65);">Mission</span>
                <textarea id="e_mission" rows="3" style="padding:10px 12px; border-radius:12px; border:1px solid rgba(255,255,255,0.14); background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.92); resize:vertical;"></textarea>
              </label>

              <label style="display:grid; gap:6px;">
                <span style="font-size:12px; color: rgba(255,255,255,0.65);">Notes</span>
                <textarea id="e_notes" rows="3" style="padding:10px 12px; border-radius:12px; border:1px solid rgba(255,255,255,0.14); background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.92); resize:vertical;"></textarea>
              </label>

              <div id="editError" style="display:none; color: rgba(255,140,140,0.95); font-size:12px;"></div>

              <div style="display:flex; gap:10px; justify-content:flex-end;">
                <button class="btn" type="button" id="editCancelBtn">Annuler</button>
                <button class="btn" type="submit" id="editSubmitBtn" style="border-color: rgba(255,255,255,0.22);">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function bindBoardEvents(root, items, { onLogout, onPatchStatus, onDelete, onCreate, onUpdate } = {}) {
  const byId = new Map((items || []).map((it) => [it.applicationId, it]));

  const globalError = root.querySelector("#globalError");
  function setGlobalError(msg) {
    if (!globalError) return;
    globalError.textContent = msg || "";
    globalError.style.display = msg ? "block" : "none";
  }
  // clear any previous banner on render
  setGlobalError("");
  // expose to main.js
  root.setGlobalError = setGlobalError;

  const backdrop = root.querySelector("#modalBackdrop");
  const closeBtn = root.querySelector("#closeModalBtn");
  const modalError = root.querySelector("#modalError");
  let currentAppId = null;

  const confirmBackdrop = root.querySelector("#confirmBackdrop");
  const confirmCancelBtn = root.querySelector("#confirmCancelBtn");
  const confirmDeleteBtn = root.querySelector("#confirmDeleteBtn");
  const confirmError = root.querySelector("#confirmError");

  const createBackdrop = root.querySelector("#createBackdrop");
  const closeCreateBtn = root.querySelector("#closeCreateBtn");
  const createCancelBtn = root.querySelector("#createCancelBtn");
  const createForm = root.querySelector("#createForm");
  const createError = root.querySelector("#createError");

  const editBackdrop = root.querySelector("#editBackdrop");
  const closeEditBtn = root.querySelector("#closeEditBtn");
  const editCancelBtn = root.querySelector("#editCancelBtn");
  const editForm = root.querySelector("#editForm");
  const editError = root.querySelector("#editError");

  let currentApp = null;

  function showEditError(msg) {
    if (!editError) return;
    editError.textContent = msg;
    editError.style.display = msg ? "block" : "none";
  }

  function closeEdit() {
    showEditError("");
    if (editBackdrop) editBackdrop.style.display = "none";
    if (editForm) editForm.reset();
  }

  function openEdit(app) {
    if (!app) return;
    showEditError("");
    currentApp = app;

    root.querySelector("#e_title").value = app.title || "";
    root.querySelector("#e_company").value = app.company || "";
    root.querySelector("#e_location").value = app.location || "";
    root.querySelector("#e_appliedDate").value = app.appliedDate || "";
    root.querySelector("#e_jobUrl").value = app.jobUrl || "";
    root.querySelector("#e_contact").value = app.contact || "";
    root.querySelector("#e_mission").value = app.mission || "";
    root.querySelector("#e_notes").value = app.notes || "";

    if (editBackdrop) editBackdrop.style.display = "block";
  }

  let pendingDeleteId = null;

  function showConfirmError(msg) {
    if (!confirmError) return;
    confirmError.textContent = msg;
    confirmError.style.display = msg ? "block" : "none";
  }

  function closeConfirm() {
    pendingDeleteId = null;
    showConfirmError("");
    if (confirmBackdrop) confirmBackdrop.style.display = "none";
  }

  function showCreateError(msg) {
    if (!createError) return;
    createError.textContent = msg;
    createError.style.display = msg ? "block" : "none";
  }

  function closeCreate() {
    showCreateError("");
    if (createBackdrop) createBackdrop.style.display = "none";
    // reset form fields
    if (createForm) createForm.reset();
  }

  function openCreate() {
    showCreateError("");
    if (createBackdrop) createBackdrop.style.display = "block";
  }

  function showError(msg) {
    if (!modalError) return;
    modalError.textContent = msg;
    modalError.style.display = msg ? "block" : "none";
  }

  function closeModal() {
    currentAppId = null;
    showError("");
    if (backdrop) backdrop.style.display = "none";
    closeConfirm();
    closeEdit();
  }

  function openModal(app) {
    currentAppId = app.applicationId;
    currentApp = app;
    showError("");
    root.querySelector("#modalTitle").textContent = app.title || "";
    root.querySelector("#modalSub").textContent = `${app.company || ""} • ${app.location || ""} • ${app.status || ""}`;

    const body = root.querySelector("#modalBody");
    body.innerHTML = `
      <div class="meta">
        <span>Date: ${escapeHtml(formatDate(app.appliedDate))}</span>
        <span>Contact: ${escapeHtml(app.contact || "-")}</span>
      </div>
      <div style="border:1px solid rgba(255,255,255,0.10); border-radius:14px; padding:12px; background: rgba(255,255,255,0.04);">
        <div style="color: rgba(255,255,255,0.65); font-size:12px; margin-bottom:6px;">Mission</div>
        <div>${escapeHtml(app.mission || "-")}</div>
      </div>
      <div style="border:1px solid rgba(255,255,255,0.10); border-radius:14px; padding:12px; background: rgba(255,255,255,0.04);">
        <div style="color: rgba(255,255,255,0.65); font-size:12px; margin-bottom:6px;">Notes</div>
        <div>${escapeHtml(app.notes || "-")}</div>
      </div>
      <div style="border:1px solid rgba(255,255,255,0.10); border-radius:14px; padding:12px; background: rgba(255,255,255,0.04);">
        <div style="color: rgba(255,255,255,0.65); font-size:12px; margin-bottom:6px;">Lien</div>
        <div>${app.jobUrl ? `<a href="${escapeHtml(app.jobUrl)}" target="_blank" rel="noreferrer">Ouvrir l’annonce</a>` : "-"}</div>
      </div>
    `;

    if (backdrop) backdrop.style.display = "block";
  }

  // Close interactions
  closeBtn?.addEventListener("click", closeModal);
  backdrop?.addEventListener("click", (e) => {
    if (e.target === backdrop) closeModal();
  });

  // Card click
  root.querySelectorAll(".card[data-id]").forEach((el) => {
    el.addEventListener("click", () => {
      const id = el.getAttribute("data-id");
      const app = byId.get(id);
      if (app) openModal(app);
    });
  });

  async function doPatchStatus(nextStatus, closedReason = null) {
    if (!currentAppId || !onPatchStatus) return;
    try {
      showError("");
      await onPatchStatus(currentAppId, { status: nextStatus, ...(closedReason ? { closedReason } : {}) });
      closeModal();
    } catch (err) {
      showError(err?.message || "Action failed");
    }
  }

  function doDelete() {
    if (!currentAppId || !onDelete) return;
    pendingDeleteId = currentAppId;
    showConfirmError("");
    if (confirmBackdrop) confirmBackdrop.style.display = "block";
  }

  root.querySelector("#btnStatusInProgress")?.addEventListener("click", () => doPatchStatus("IN_PROGRESS"));
  root.querySelector("#btnStatusAccepted")?.addEventListener("click", () => doPatchStatus("ACCEPTED"));
  root.querySelector("#btnStatusRefused")?.addEventListener("click", () => doPatchStatus("CLOSED", "REFUSED"));
  root.querySelector("#btnStatusAbandoned")?.addEventListener("click", () => doPatchStatus("CLOSED", "ABANDONED"));
  root.querySelector("#btnDelete")?.addEventListener("click", doDelete);

  root.querySelector("#btnEdit")?.addEventListener("click", () => {
    if (!onUpdate) return;
    const app = byId.get(currentAppId);
    openEdit(app);
  });

  // Confirm delete modal handlers
  confirmCancelBtn?.addEventListener("click", closeConfirm);
  confirmBackdrop?.addEventListener("click", (e) => {
    if (e.target === confirmBackdrop) closeConfirm();
  });

  confirmDeleteBtn?.addEventListener("click", async () => {
    if (!pendingDeleteId || !onDelete) return;
    try {
      confirmDeleteBtn && (confirmDeleteBtn.disabled = true);
      showConfirmError("");
      await onDelete(pendingDeleteId);
      closeConfirm();
      closeModal();
    } catch (err) {
      showConfirmError(err?.message || "Delete failed");
    } finally {
      confirmDeleteBtn && (confirmDeleteBtn.disabled = false);
    }
  });

  // Logout
  root.querySelector("#logoutBtn")?.addEventListener("click", () => {
    if (onLogout) onLogout();
  });

  // Create modal open button
  root.querySelector("#newAppBtn")?.addEventListener("click", () => {
    if (!onCreate) return;
    openCreate();
  });

  // Create modal close/cancel
  closeCreateBtn?.addEventListener("click", closeCreate);
  createCancelBtn?.addEventListener("click", closeCreate);
  createBackdrop?.addEventListener("click", (e) => {
    if (e.target === createBackdrop) closeCreate();
  });

  // Edit modal close/cancel
  closeEditBtn?.addEventListener("click", closeEdit);
  editCancelBtn?.addEventListener("click", closeEdit);
  editBackdrop?.addEventListener("click", (e) => {
    if (e.target === editBackdrop) closeEdit();
  });

  // Create form submit
  createForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!onCreate) return;

    const title = root.querySelector("#c_title")?.value?.trim();
    const company = root.querySelector("#c_company")?.value?.trim();
    const location = root.querySelector("#c_location")?.value?.trim();
    const appliedDate = root.querySelector("#c_appliedDate")?.value;

    if (!title || !company || !location || !appliedDate) {
      showCreateError("Poste, entreprise, lieu et date sont obligatoires.");
      return;
    }

    const payload = {
      title,
      company,
      location,
      appliedDate,
      jobUrl: root.querySelector("#c_jobUrl")?.value?.trim() || undefined,
      contact: root.querySelector("#c_contact")?.value?.trim() || undefined,
      status: root.querySelector("#c_status")?.value || "IN_PROGRESS",
      mission: root.querySelector("#c_mission")?.value?.trim() || undefined,
      notes: root.querySelector("#c_notes")?.value?.trim() || undefined,
    };

    const submitBtn = root.querySelector("#createSubmitBtn");
    submitBtn && (submitBtn.disabled = true);
    try {
      showCreateError("");
      await onCreate(payload);
      closeCreate();
    } catch (err) {
      showCreateError(err?.message || "Create failed");
    } finally {
      submitBtn && (submitBtn.disabled = false);
    }
  });

  // Edit form submit
  editForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!onUpdate || !currentAppId) return;

    const title = root.querySelector("#e_title")?.value?.trim();
    const company = root.querySelector("#e_company")?.value?.trim();
    const location = root.querySelector("#e_location")?.value?.trim();
    const appliedDate = root.querySelector("#e_appliedDate")?.value;

    if (!title || !company || !location || !appliedDate) {
      showEditError("Poste, entreprise, lieu et date sont obligatoires.");
      return;
    }

    const payload = {
      title,
      company,
      location,
      appliedDate,
      jobUrl: root.querySelector("#e_jobUrl")?.value?.trim() || undefined,
      contact: root.querySelector("#e_contact")?.value?.trim() || undefined,
      mission: root.querySelector("#e_mission")?.value?.trim() || undefined,
      notes: root.querySelector("#e_notes")?.value?.trim() || undefined,
    };

    const submitBtn = root.querySelector("#editSubmitBtn");
    submitBtn && (submitBtn.disabled = true);
    try {
      showEditError("");
      await onUpdate(currentAppId, payload);
      closeEdit();
      closeModal();
    } catch (err) {
      showEditError(err?.message || "Update failed");
    } finally {
      submitBtn && (submitBtn.disabled = false);
    }
  });
}