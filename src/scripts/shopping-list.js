import { supabase } from "../supabase.js";

// Shopping List script

const listEl = document.getElementById("list");
const emptyStateEl = document.getElementById("emptyState");
const statusEl = document.getElementById("status");
const btnCheckAll = document.getElementById("btnCheckAll");
const btnUncheckAll = document.getElementById("btnUncheckAll");
const addForm = document.getElementById("addForm");
const fItem = document.getElementById("fItem");
const fQty = document.getElementById("fQty");

// Data sources
let computedBase = []; // From API (structure)
let savedState = new Map(); // From Supabase listener (checked status)
let customItems = []; // From Supabase listener (manual items)

// Merged list for display
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
    if (refId) {
        return `${base}||recipe:${refId}`;
    }
    const label = normalizeTitle(ref?.title || entry.primaryRecipe || SECTION_FALLBACK);
    return `${base}||title:${label.toLowerCase()}`;
}

// --- Core Logic ---

// Expand the computed items (ingredients) into individual rows per recipe occurrence
function expandComputedEntry(entry) {
    const baseKey = makeKey(entry);
    const totalQuantity = Number.isFinite(entry.quantity) ? entry.quantity : undefined;

    const rawRefs = Array.isArray(entry.recipes) ? entry.recipes : [];
    const refs = rawRefs.length
        ? rawRefs
        : [{ id: null, title: entry.primaryRecipe || SECTION_FALLBACK, quantity: totalQuantity, occurrences: 1 }];

    // Expand each recipe reference by its number of occurrences
    const expanded = [];
    refs.forEach((ref) => {
        const label = normalizeTitle(ref?.title);
        const occurrences = Number.isFinite(ref?.occurrences) && ref.occurrences > 0 ? ref.occurrences : 1;
        
        // Calculate quantity per occurrence
        // The API returns the total quantity (sum of all occurrences), so we divide by occurrences
        let refQuantity;
        if (Number.isFinite(ref?.quantity) && occurrences > 0) {
            refQuantity = ref.quantity / occurrences;
        } else if (Number.isFinite(ref?.quantity)) {
            refQuantity = ref.quantity;
        } else {
            refQuantity = totalQuantity;
        }
        
        // Create one entry per occurrence
        for (let i = 0; i < occurrences; i++) {
            // Create a unique entryKey for each occurrence
            const occurrenceKey = `${ref?.id || label}_${i}`;
            const entryKey = makeEntryKey(entry, { id: occurrenceKey, title: label });

            // Check if this specific entry is checked in our saved state
            // Fallback to base key if needed (backward compatibility)
            const isChecked = savedState.get(entryKey) ?? savedState.get(baseKey) ?? false;

            // Create unique section key and label for each occurrence
            // This ensures each occurrence appears as a separate section in normal view
            const sectionLabel = occurrences > 1 ? `${label} (${i + 1})` : label;
            const sectionKey = occurrences > 1 
                ? `${makeSectionKey(label)}_${i}` 
                : makeSectionKey(label);

            expanded.push({
                source: "computed",
                item: entry.item,
                unit: entry.unit,
                quantity: refQuantity, // Quantity per occurrence
                checked: isChecked,
                sectionKey: sectionKey,
                sectionLabel: sectionLabel,
                baseKey,
                baseQuantity: totalQuantity,
                entryKey,
                recipeId: typeof ref?.id === "string" && ref.id.trim() ? ref.id.trim() : null,
                occurrenceIndex: i, // Track which occurrence this is
            });
        }
    });

    return expanded.sort((a, b) => {
        // Sort by section label first
        const sectionCmp = a.sectionLabel.localeCompare(b.sectionLabel, "fr");
        if (sectionCmp !== 0) return sectionCmp;
        // Then by occurrence index to keep them in order
        return (a.occurrenceIndex || 0) - (b.occurrenceIndex || 0);
    });
}

// Aggregate items by name and unit (for condensed view)
function aggregateItems(itemList) {
    const aggregated = new Map();
    const checkedCounts = new Map(); // Track how many items are checked per aggregated key
    
    itemList.forEach((item) => {
        // Skip custom items in aggregation, they stay as-is
        if (item.source === "custom") {
            const key = `custom:${item.item}`;
            if (!aggregated.has(key)) {
                aggregated.set(key, {
                    ...item,
                    aggregated: false,
                });
            }
            return;
        }
        
        // For computed items, aggregate by item name and unit
        const key = `${String(item.item || "").trim().toLowerCase()}|||${String(item.unit || "").trim().toLowerCase()}`;
        
        if (aggregated.has(key)) {
            const existing = aggregated.get(key);
            // Sum quantities only if both are defined
            const qty1 = Number.isFinite(existing.quantity) ? existing.quantity : undefined;
            const qty2 = Number.isFinite(item.quantity) ? item.quantity : undefined;
            
            if (Number.isFinite(qty1) && Number.isFinite(qty2)) {
                existing.quantity = qty1 + qty2;
            } else if (Number.isFinite(qty2)) {
                existing.quantity = qty2;
            } else if (Number.isFinite(qty1)) {
                existing.quantity = qty1;
            } else {
                // Neither has a quantity, keep it undefined
                existing.quantity = undefined;
            }
            
            // Increment total count
            existing._count = (existing._count || 1) + 1;
            // Track checked count
            const count = checkedCounts.get(key) || 0;
            checkedCounts.set(key, count + (item.checked ? 1 : 0));
            // Combine section labels
            if (existing.sectionLabel !== item.sectionLabel) {
                existing.sectionLabel = "Toutes recettes";
            }
        } else {
            aggregated.set(key, {
                ...item,
                aggregated: true,
                sectionLabel: "Toutes recettes",
                sectionKey: "0:all",
                _count: 1, // Track total count of items for this aggregated entry
            });
            checkedCounts.set(key, item.checked ? 1 : 0);
        }
    });
    
    // Update checked state: checked only if ALL items are checked
    aggregated.forEach((item, key) => {
        if (item.aggregated) {
            const checkedCount = checkedCounts.get(key) || 0;
            const totalCount = item._count || 1;
            item.checked = checkedCount === totalCount;
            delete item._count; // Clean up temporary property
        }
    });
    
    return Array.from(aggregated.values());
}

// Merge all sources and render
function updateAndRender() {
    // 1. Expand computed items with current saved state
    const expandedComputed = computedBase.flatMap(expandComputedEntry);

    // 2. Combine with custom items
    const allItems = [...expandedComputed, ...customItems];

    // 3. Apply view mode
    if (viewMode === 'condensed') {
        items = aggregateItems(allItems);
    } else {
        items = allItems;
    }

    // 4. Render
    render();
}

// Fetch the structure (ingredients needed) from API
// This is called when Planning or Reception changes
async function fetchComputed() {
    try {
        const res = await fetch("/api/compute-shopping-totals");
        if (!res.ok) throw new Error("API error " + res.status);
        const data = await res.json();
        computedBase = Array.isArray(data.items) ? data.items : [];
        updateAndRender();
    } catch (e) {
        console.error("Error fetching computed totals:", e);
    }
}

// --- Listeners ---

// 1. Fetch Shopping Totals (Checked State) - Use API endpoint instead of direct Supabase
async function fetchShoppingTotals() {
    try {
        const res = await fetch('/api/save-shopping-totals');
        if (!res.ok) {
            console.warn("Failed to fetch shopping totals:", res.status);
            return;
        }
        const { items: rawItems } = await res.json();

        const newSavedState = new Map();
        for (const s of rawItems || []) {
            const state = !!s.checked;
            const entryKey = typeof s?.entryKey === "string" && s.entryKey.trim() ? s.entryKey.trim() : "";

            if (entryKey) {
                newSavedState.set(entryKey, state);
            }
            // Also map by base key for robustness
            const base = makeKey(s);
            if (!newSavedState.has(base) || state) {
                newSavedState.set(base, state);
            }
        }

        savedState = newSavedState;
        updateAndRender();
    } catch (e) {
        console.error("Error fetching shopping totals:", e);
    }
}

// 2. Fetch Custom Items - Use API endpoint instead of direct Supabase
async function fetchCustomItems() {
    try {
        const res = await fetch('/api/custom-items');
        if (!res.ok) {
            console.warn("Failed to fetch custom items:", res.status);
            return;
        }
        const { items: rawCustoms } = await res.json();

        customItems = (rawCustoms || []).map(decorateCustomItem);
        updateAndRender();
    } catch (e) {
        console.error("Error fetching custom items:", e);
    }
}

function setupListeners() {

    // Initial fetch
    fetchShoppingTotals();
    fetchCustomItems();

    // Subscribe to changes using Supabase Realtime
    // Note: RLS will automatically filter by user_id, so we don't need to specify it in the filter
    const shoppingTotalsChannel = supabase
        .channel('shopping_totals_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'shopping_totals' }, () => {
            fetchShoppingTotals();
        })
        .subscribe();

    const customItemsChannel = supabase
        .channel('shopping_custom_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'shopping_custom' }, () => {
            fetchCustomItems();
        })
        .subscribe();

    // 3. Listen to Planning & Reception changes to re-fetch computed structure
    let fetchTimeout;
    const triggerFetch = () => {
        clearTimeout(fetchTimeout);
        fetchTimeout = setTimeout(fetchComputed, 500);
    };

    const planningChannel = supabase
        .channel('planning_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'planning' }, triggerFetch)
        .subscribe();

    const receptionChannel = supabase
        .channel('reception_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'reception' }, triggerFetch)
        .subscribe();
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
        const txt = hasQty
            ? `${row.item} : ${row.quantity}${row.unit ? " " + row.unit : ""}`
            : row.item;

        const li = document.createElement("li");
        li.className = "group flex items-center justify-between gap-4 px-5 py-4 hover:bg-slate-50 transition duration-200";

        // Checkbox + Label
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

        // Actions
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
        cb.addEventListener("change", async () => {
            // Optimistic UI update (visual only, state will be refreshed by listener)
            if (cb.checked) {
                mainText.classList.add("line-through", "text-slate-400");
                mainText.classList.remove("text-slate-700");
            } else {
                mainText.classList.remove("line-through", "text-slate-400");
                mainText.classList.add("text-slate-700");
            }

            status("Enregistrement...");
            try {
                if (row.source === "custom") {
                    await fetch("/api/custom-items", {
                        method: "PATCH",
                        headers: { "content-type": "application/json" },
                        body: JSON.stringify({ item: row.item, checked: cb.checked }),
                    });
                } else {
                    // For computed items
                    if (viewMode === 'condensed' && row.aggregated) {
                        // In condensed view, update all items with the same name and unit
                        const itemKey = `${String(row.item || "").trim().toLowerCase()}|||${String(row.unit || "").trim().toLowerCase()}`;
                        
                        // Get all original computed items (before aggregation)
                        const expandedComputed = computedBase.flatMap(expandComputedEntry);
                        
                        // Update all matching items
                        const updatedItems = expandedComputed.map(it => {
                            const itKey = `${String(it.item || "").trim().toLowerCase()}|||${String(it.unit || "").trim().toLowerCase()}`;
                            if (itKey === itemKey) {
                                return { ...it, checked: cb.checked };
                            }
                            return it;
                        });

                        // Prepare payload for API
                        const payload = serializeComputedItems(updatedItems);

                        await fetch("/api/save-shopping-totals", {
                            method: "POST",
                            headers: { "content-type": "application/json" },
                            body: JSON.stringify({ items: payload }),
                        });
                    } else {
                        // Normal view: update only the specific item
                        const updatedItems = items
                            .filter(it => it.source === "computed")
                            .map(it => {
                                if (it.entryKey === row.entryKey) {
                                    return { ...it, checked: cb.checked };
                                }
                                return it;
                            });

                        // Prepare payload for API
                        const payload = serializeComputedItems(updatedItems);

                        await fetch("/api/save-shopping-totals", {
                            method: "POST",
                            headers: { "content-type": "application/json" },
                            body: JSON.stringify({ items: payload }),
                        });
                    }
                }
                status("✅ Sauvegardé");
            } catch (e) {
                console.error(e);
                status("❌ Erreur");
                // Revert UI if needed (listener will handle it anyway)
            }
        });
    });
}

// Helper to serialize computed items for API
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
        if (Number.isFinite(it.baseQuantity)) {
            payload.quantity = it.baseQuantity;
        }
        if (typeof it.entryKey === "string" && it.entryKey) {
            payload.entryKey = it.entryKey;
        }
        const key = payload.entryKey || makeKey(it);
        if (!seen.has(key)) {
            seen.set(key, payload);
            result.push(payload);
        } else if (payload.checked) {
            const ref = seen.get(key);
            ref.checked = true;
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

// --- Init ---

addForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const item = fItem.value.trim();
    const qtyRaw = fQty.value.trim();
    if (!item) return;

    status("Ajout...");
    try {
        const payload = { item };
        if (qtyRaw !== "") payload.quantity = Number(qtyRaw);

        await fetch("/api/custom-items", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(payload),
        });

        fItem.value = "";
        fQty.value = "";
        status("✅ Ajouté");
        
        // Rafraîchir la liste pour afficher le nouvel élément immédiatement
        await fetchCustomItems();
    } catch (e) {
        console.error(e);
        status("❌ Erreur");
    }
});

// Helper function to handle check all
async function handleCheckAll() {
    if (!items.length) return;
    status("Traitement...");

    // Separate computed and custom
    const computedToSave = items
        .filter(it => it.source === "computed")
        .map(it => ({ ...it, checked: true }));

    const customToSave = items
        .filter(it => it.source === "custom")
        .map(it => ({ item: it.item, checked: true, unit: it.unit }));

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
                body: JSON.stringify(c),
            }));
        }

        await Promise.all(reqs);
        status("✅ Tout coché");
        // Rafraîchir les données pour mettre à jour l'affichage
        await fetchShoppingTotals();
        await fetchCustomItems();
    } catch (e) {
        console.error(e);
        status("❌ Erreur");
    }
}

// Helper function to handle uncheck all
async function handleUncheckAll() {
    if (!items.length) return;
    status("Traitement...");

    const computedToSave = items
        .filter(it => it.source === "computed")
        .map(it => ({ ...it, checked: false }));

    const customToSave = items
        .filter(it => it.source === "custom")
        .map(it => ({ item: it.item, checked: false, unit: it.unit }));

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
                body: JSON.stringify(c),
            }));
        }

        await Promise.all(reqs);
        status("✅ Tout décoché");
        // Rafraîchir les données pour mettre à jour l'affichage
        await fetchShoppingTotals();
        await fetchCustomItems();
    } catch (e) {
        console.error(e);
        status("❌ Erreur");
    }
}

// Attach event listeners
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
        // Icon for list view (normal)
        viewIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path>';
    } else {
        btnToggleView.title = "Vue condensée";
        viewLabel.textContent = "Vue condensée";
        // Icon for condensed view
        viewIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7"></path>';
    }
}

btnToggleView?.addEventListener("click", () => {
    viewMode = viewMode === 'normal' ? 'condensed' : 'normal';
    updateViewButton();
    updateAndRender();
});

// Start
updateViewButton();
setupListeners();
fetchComputed(); // Initial fetch
