// Shopping List script - Version optimisée
// Un seul appel API au chargement, pas de subscriptions Realtime

const listEl = document.getElementById("list");
const emptyStateEl = document.getElementById("emptyState");
const statusEl = document.getElementById("status");
const btnCheckAll = document.getElementById("btnCheckAll");
const btnUncheckAll = document.getElementById("btnUncheckAll");
const addForm = document.getElementById("addForm");
const fItem = document.getElementById("fItem");
const fQty = document.getElementById("fQty");

// Data sources
let computedBase = [];
let savedState = new Map();
let customItems = [];
let items = [];

// View mode: 'normal' (by recipe) or 'condensed' (aggregated)
let viewMode = 'condensed';

const SECTION_FALLBACK = "Autres recettes";
const SECTION_CUSTOM = "Divers";

// --- Helpers ---

function normalizeTitle(input) {
  const t = String(input || "").trim();
  return t || SECTION_FALLBACK;
}

function decorateCustomItem(it) {
  return {
    ...it,
    sectionKey: "2:custom",
    sectionLabel: SECTION_CUSTOM,
    source: "custom",
  };
}

function makeSectionKey(title) {
  return `1:${normalizeTitle(title).toLowerCase()}`;
}

const makeKey = (it) =>
  `${String(it.item || "").trim().toLowerCase()}|||${String(it.unit || "").trim().toLowerCase()}`;

function makeEntryKey(entry, ref) {
  const base = makeKey(entry);
  const refId = typeof ref?.id === "string" && ref.id.trim() ? ref.id.trim() : "";
  if (refId) return `${base}||recipe:${refId}`;
  const label = normalizeTitle(ref?.title || entry.primaryRecipe || SECTION_FALLBACK);
  return `${base}||title:${label.toLowerCase()}`;
}

// --- Core Logic ---

function expandComputedEntry(entry) {
  const baseKey = makeKey(entry);
  const totalQuantity = Number.isFinite(entry.quantity) ? entry.quantity : undefined;

  const rawRefs = Array.isArray(entry.recipes) ? entry.recipes : [];
  const refs = rawRefs.length
    ? rawRefs
    : [{ id: null, title: entry.primaryRecipe || SECTION_FALLBACK, quantity: totalQuantity, occurrences: 1 }];

  const expanded = [];
  refs.forEach((ref) => {
    const label = normalizeTitle(ref?.title);
    const occurrences = Number.isFinite(ref?.occurrences) && ref.occurrences > 0 ? ref.occurrences : 1;

    let refQuantity;
    if (Number.isFinite(ref?.quantity) && occurrences > 0) {
      refQuantity = ref.quantity / occurrences;
    } else if (Number.isFinite(ref?.quantity)) {
      refQuantity = ref.quantity;
    } else {
      refQuantity = totalQuantity;
    }

    for (let i = 0; i < occurrences; i++) {
      const occurrenceKey = `${ref?.id || label}_${i}`;
      const entryKey = makeEntryKey(entry, { id: occurrenceKey, title: label });
      const isChecked = savedState.get(entryKey) ?? savedState.get(baseKey) ?? false;
      const sectionLabel = occurrences > 1 ? `${label} (${i + 1})` : label;
      const sectionKey = occurrences > 1 ? `${makeSectionKey(label)}_${i}` : makeSectionKey(label);

      expanded.push({
        source: "computed",
        item: entry.item,
        unit: entry.unit,
        quantity: refQuantity,
        checked: isChecked,
        sectionKey,
        sectionLabel,
        baseKey,
        baseQuantity: totalQuantity,
        entryKey,
        recipeId: typeof ref?.id === "string" && ref.id.trim() ? ref.id.trim() : null,
        occurrenceIndex: i,
      });
    }
  });

  return expanded.sort((a, b) => {
    const sectionCmp = a.sectionLabel.localeCompare(b.sectionLabel, "fr");
    if (sectionCmp !== 0) return sectionCmp;
    return (a.occurrenceIndex || 0) - (b.occurrenceIndex || 0);
  });
}

function aggregateItems(itemList) {
  const aggregated = new Map();
  const checkedCounts = new Map();

  itemList.forEach((item) => {
    if (item.source === "custom") {
      const key = `custom:${item.item}`;
      if (!aggregated.has(key)) {
        aggregated.set(key, { ...item, aggregated: false });
      }
      return;
    }

    const key = `${String(item.item || "").trim().toLowerCase()}|||${String(item.unit || "").trim().toLowerCase()}`;

    if (aggregated.has(key)) {
      const existing = aggregated.get(key);
      const qty1 = Number.isFinite(existing.quantity) ? existing.quantity : undefined;
      const qty2 = Number.isFinite(item.quantity) ? item.quantity : undefined;

      if (Number.isFinite(qty1) && Number.isFinite(qty2)) {
        existing.quantity = qty1 + qty2;
      } else if (Number.isFinite(qty2)) {
        existing.quantity = qty2;
      }

      existing._count = (existing._count || 1) + 1;
      const count = checkedCounts.get(key) || 0;
      checkedCounts.set(key, count + (item.checked ? 1 : 0));
      if (existing.sectionLabel !== item.sectionLabel) {
        existing.sectionLabel = "Toutes recettes";
      }
    } else {
      aggregated.set(key, {
        ...item,
        aggregated: true,
        sectionLabel: "Toutes recettes",
        sectionKey: "0:all",
        _count: 1,
      });
      checkedCounts.set(key, item.checked ? 1 : 0);
    }
  });

  aggregated.forEach((item, key) => {
    if (item.aggregated) {
      const checkedCount = checkedCounts.get(key) || 0;
      const totalCount = item._count || 1;
      item.checked = checkedCount === totalCount;
      delete item._count;
    }
  });

  return Array.from(aggregated.values());
}

function updateAndRender() {
  const expandedComputed = computedBase.flatMap(expandComputedEntry);
  const allItems = [...expandedComputed, ...customItems];
  items = viewMode === 'condensed' ? aggregateItems(allItems) : allItems;
  render();
}

// Fetch all data in a single API call
async function fetchAllData() {
  try {
    status("Chargement...");
    const res = await fetch("/api/shopping-list-data");
    if (!res.ok) throw new Error("API error " + res.status);
    
    const data = await res.json();
    
    // Update computed items
    computedBase = Array.isArray(data.computed) ? data.computed : [];
    
    // Update saved state
    const newSavedState = new Map();
    for (const s of data.savedTotals || []) {
      const state = !!s.checked;
      const entryKey = typeof s?.entryKey === "string" && s.entryKey.trim() ? s.entryKey.trim() : "";
      if (entryKey) newSavedState.set(entryKey, state);
      const base = makeKey(s);
      if (!newSavedState.has(base) || state) newSavedState.set(base, state);
    }
    savedState = newSavedState;
    
    // Update custom items
    customItems = (data.customItems || []).map(decorateCustomItem);
    
    updateAndRender();
    status("");
  } catch (e) {
    console.error("Error fetching shopping list data:", e);
    status("❌ Erreur de chargement");
  }
}

// --- UI Rendering ---

function sortItems() {
  items.sort((a, b) => {
    const keyA = a.sectionKey || "";
    const keyB = b.sectionKey || "";
    if (keyA !== keyB) return keyA.localeCompare(keyB, "fr");
    if (a.checked !== b.checked) return a.checked ? 1 : -1;
    return String(a.item || "").localeCompare(String(b.item || ""), "fr");
  });
}

function updateBulkButtons() {
  const hasItems = Array.isArray(items) && items.length > 0;
  const noneChecked = !hasItems || items.every((it) => !it.checked);

  const toggleState = (btn, disable) => {
    if (!btn) return;
    btn.disabled = disable;
    btn.classList.toggle("opacity-50", disable);
    btn.classList.toggle("cursor-not-allowed", disable);
  };

  toggleState(btnCheckAll, !hasItems || !items.some((it) => !it.checked));
  toggleState(btnUncheckAll, !hasItems || noneChecked);
}

function render() {
  sortItems();
  listEl.innerHTML = "";
  updateBulkButtons();

  if (!Array.isArray(items) || items.length === 0) {
    listEl.classList.add("hidden");
    emptyStateEl.classList.remove("hidden");
    return;
  } else {
    listEl.classList.remove("hidden");
    emptyStateEl.classList.add("hidden");
  }

  let currentSectionKey = null;

  items.forEach((row, idx) => {
    const isCustom = row.source === "custom";
    const sectionKey = row.sectionKey || (isCustom ? "2:custom" : "1:autres");
    const sectionLabel = row.sectionLabel || (isCustom ? SECTION_CUSTOM : SECTION_FALLBACK);

    if (sectionKey !== currentSectionKey) {
      currentSectionKey = sectionKey;
      const header = document.createElement("li");
      header.className = "bg-slate-50/80 px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 sticky top-0 backdrop-blur-sm z-10";

      if (sectionKey === "2:custom") {
        const wrap = document.createElement("div");
        wrap.className = "flex items-center justify-between gap-3";

        const title = document.createElement("span");
        title.textContent = sectionLabel;
        wrap.appendChild(title);

        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "rounded-lg bg-rose-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-rose-600 transition hover:bg-rose-100 hover:text-rose-700";
        btn.textContent = "Tout supprimer";
        btn.addEventListener("click", async () => {
          if (!items.some((it) => it.source === "custom")) return;
          if (!confirm("Supprimer tous les éléments ajoutés manuellement ?")) return;
          status("Suppression...");
          try {
            await fetch("/api/custom-items?all=1", { method: "DELETE" });
            customItems = [];
            updateAndRender();
            status("✅ Supprimé");
          } catch (e) {
            console.error(e);
            status("❌ Erreur");
          }
        });
        wrap.appendChild(btn);
        header.appendChild(wrap);
      } else {
        header.textContent = sectionLabel;
      }
      listEl.appendChild(header);
    }

    const hasQty = typeof row.quantity === "number" && !isNaN(row.quantity) && row.quantity !== 0;
    const txt = hasQty ? `${row.item} : ${row.quantity}${row.unit ? " " + row.unit : ""}` : row.item;

    const li = document.createElement("li");
    li.className = "group flex items-center justify-between gap-4 px-5 py-4 hover:bg-slate-50 transition duration-200";

    const left = document.createElement("label");
    left.className = "flex items-center gap-4 cursor-pointer select-none flex-1 min-w-0";

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.dataset.idx = String(idx);
    cb.checked = !!row.checked;
    cb.className = "peer h-5 w-5 shrink-0 rounded-lg border-slate-300 text-blue-600 focus:ring-offset-0 focus:ring-2 focus:ring-blue-500 transition cursor-pointer";

    const labelWrapper = document.createElement("div");
    labelWrapper.className = "flex flex-col min-w-0";

    const mainText = document.createElement("span");
    mainText.className = "text-sm font-medium truncate transition-colors duration-200 " + (cb.checked ? "line-through text-slate-400" : "text-slate-700");
    mainText.textContent = txt;
    labelWrapper.appendChild(mainText);

    left.appendChild(cb);
    left.appendChild(labelWrapper);

    const right = document.createElement("div");
    right.className = "flex items-center gap-2";

    if (isCustom) {
      const del = document.createElement("button");
      del.type = "button";
      del.className = "del-btn flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition";
      del.title = "Supprimer";
      del.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m1 0H8m8 0l-1-3H9L8 7" /></svg>';
      del.addEventListener("click", async () => {
        status("Suppression...");
        try {
          const params = new URLSearchParams({ item: row.item });
          await fetch(`/api/custom-items?${params.toString()}`, { method: "DELETE" });
          customItems = customItems.filter(c => c.item.toLowerCase() !== row.item.toLowerCase());
          updateAndRender();
          status("✅ Supprimé");
        } catch (e) {
          console.error(e);
          status("❌ Erreur");
        }
      });
      right.appendChild(del);
    }

    li.appendChild(left);
    li.appendChild(right);
    listEl.appendChild(li);

    // Handle Check
    cb.addEventListener("change", () => {
      const newCheckedState = cb.checked;

      // Optimistic UI update
      if (newCheckedState) {
        mainText.classList.add("line-through", "text-slate-400");
        mainText.classList.remove("text-slate-700");
      } else {
        mainText.classList.remove("line-through", "text-slate-400");
        mainText.classList.add("text-slate-700");
      }

      // Update local state immediately
      row.checked = newCheckedState;

      // Save in background without blocking UI
      (async () => {
        try {
          if (row.source === "custom") {
            // Update local state
            const customItem = customItems.find(c => c.item.toLowerCase() === row.item.toLowerCase());
            if (customItem) customItem.checked = newCheckedState;

            // Save to server
            fetch("/api/custom-items", {
              method: "PATCH",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ item: row.item, checked: newCheckedState }),
            }).catch(err => console.error("Error saving custom item:", err));
          } else {
            if (viewMode === 'condensed' && row.aggregated) {
              const itemKey = `${String(row.item || "").trim().toLowerCase()}|||${String(row.unit || "").trim().toLowerCase()}`;
              const expandedComputed = computedBase.flatMap(expandComputedEntry);
              const updatedItems = expandedComputed.map(it => {
                const itKey = `${String(it.item || "").trim().toLowerCase()}|||${String(it.unit || "").trim().toLowerCase()}`;
                if (itKey === itemKey) {
                  // Update savedState for this item
                  if (it.entryKey) savedState.set(it.entryKey, newCheckedState);
                  const baseKey = makeKey(it);
                  savedState.set(baseKey, newCheckedState);
                  return { ...it, checked: newCheckedState };
                }
                return it;
              });
              const payload = serializeComputedItems(updatedItems);

              // Save to server in background
              fetch("/api/save-shopping-totals", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ items: payload }),
              }).catch(err => console.error("Error saving shopping totals:", err));
            } else {
              // Update savedState for this specific item
              if (row.entryKey) savedState.set(row.entryKey, newCheckedState);
              const baseKey = makeKey(row);
              savedState.set(baseKey, newCheckedState);

              const updatedItems = items.filter(it => it.source === "computed").map(it => {
                if (it.entryKey === row.entryKey) return { ...it, checked: newCheckedState };
                return it;
              });
              const payload = serializeComputedItems(updatedItems);

              // Save to server in background
              fetch("/api/save-shopping-totals", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ items: payload }),
              }).catch(err => console.error("Error saving shopping totals:", err));
            }
          }
        } catch (e) {
          console.error("Error in checkbox handler:", e);
        }
      })();
    });
  });
}

function serializeComputedItems(computedList) {
  const seen = new Map();
  const result = [];
  computedList.forEach((it) => {
    const unitValue = typeof it.unit === "string" ? it.unit : "";
    const payload = {
      item: it.item,
      unit: unitValue,
      checked: !!it.checked,
    };
    if (Number.isFinite(it.baseQuantity)) payload.quantity = it.baseQuantity;
    if (typeof it.entryKey === "string" && it.entryKey) payload.entryKey = it.entryKey;
    const key = payload.entryKey || makeKey(it);
    if (!seen.has(key)) {
      seen.set(key, payload);
      result.push(payload);
    } else if (payload.checked) {
      seen.get(key).checked = true;
    }
  });
  return result;
}

function status(t) {
  statusEl.textContent = t || "";
  if (t && (t.includes("✅") || t === "OK")) {
    setTimeout(() => {
      if (statusEl.textContent === t) statusEl.textContent = "";
    }, 2000);
  }
}

// --- Event Handlers ---

addForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const item = fItem.value.trim();
  const qtyRaw = fQty.value.trim();
  if (!item) return;

  status("Ajout...");
  try {
    const payload = { item };
    if (qtyRaw !== "") payload.quantity = Number(qtyRaw);

    const res = await fetch("/api/custom-items", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    
    const data = await res.json();
    if (data.items) {
      customItems = data.items.map(decorateCustomItem);
    }

    fItem.value = "";
    fQty.value = "";
    updateAndRender();
    status("✅ Ajouté");
  } catch (e) {
    console.error(e);
    status("❌ Erreur");
  }
});

function handleCheckAll() {
  if (!items.length) return;

  // Update UI immediately
  items.forEach(item => {
    item.checked = true;
    if (item.source === "custom") {
      const customItem = customItems.find(c => c.item.toLowerCase() === item.item.toLowerCase());
      if (customItem) customItem.checked = true;
    } else {
      if (item.entryKey) savedState.set(item.entryKey, true);
      const baseKey = makeKey(item);
      savedState.set(baseKey, true);
    }
  });

  // Re-render immediately
  updateAndRender();
  status("✅ Tout coché");

  // Save in background
  const computedToSave = items.filter(it => it.source === "computed").map(it => ({ ...it, checked: true }));
  const customToSave = items.filter(it => it.source === "custom");

  (async () => {
    try {
      const reqs = [];
      if (computedToSave.length) {
        const payload = serializeComputedItems(computedToSave);
        reqs.push(fetch("/api/save-shopping-totals", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ items: payload }),
        }));
      }

      for (const c of customToSave) {
        reqs.push(fetch("/api/custom-items", {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ item: c.item, checked: true }),
        }));
      }

      await Promise.all(reqs);
    } catch (e) {
      console.error("Error saving check all:", e);
    }
  })();
}

function handleUncheckAll() {
  if (!items.length) return;

  // Update UI immediately
  items.forEach(item => {
    item.checked = false;
    if (item.source === "custom") {
      const customItem = customItems.find(c => c.item.toLowerCase() === item.item.toLowerCase());
      if (customItem) customItem.checked = false;
    } else {
      if (item.entryKey) savedState.set(item.entryKey, false);
      const baseKey = makeKey(item);
      savedState.set(baseKey, false);
    }
  });

  // Re-render immediately
  updateAndRender();
  status("✅ Tout décoché");

  // Save in background
  const computedToSave = items.filter(it => it.source === "computed").map(it => ({ ...it, checked: false }));
  const customToSave = items.filter(it => it.source === "custom");

  (async () => {
    try {
      const reqs = [];
      if (computedToSave.length) {
        const payload = serializeComputedItems(computedToSave);
        reqs.push(fetch("/api/save-shopping-totals", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ items: payload }),
        }));
      }

      for (const c of customToSave) {
        reqs.push(fetch("/api/custom-items", {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ item: c.item, checked: false }),
        }));
      }

      await Promise.all(reqs);
    } catch (e) {
      console.error("Error saving uncheck all:", e);
    }
  })();
}

btnCheckAll?.addEventListener("click", handleCheckAll);
btnUncheckAll?.addEventListener("click", handleUncheckAll);

// Toggle view mode
const btnToggleView = document.getElementById("btnToggleView");
const viewIcon = document.getElementById("viewIcon");
const viewLabel = document.getElementById("viewLabel");

function updateViewButton() {
  if (!btnToggleView || !viewIcon || !viewLabel) return;
  if (viewMode === 'condensed') {
    btnToggleView.title = "Vue par recettes";
    viewLabel.textContent = "Vue par recettes";
    viewIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path>';
  } else {
    btnToggleView.title = "Vue condensée";
    viewLabel.textContent = "Vue condensée";
    viewIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7"></path>';
  }
}

btnToggleView?.addEventListener("click", () => {
  viewMode = viewMode === 'normal' ? 'condensed' : 'normal';
  updateViewButton();
  updateAndRender();
});

// Start - Un seul appel API au lieu de 3
updateViewButton();
fetchAllData();
