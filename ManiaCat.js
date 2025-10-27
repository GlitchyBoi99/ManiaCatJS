
(() => {
  const pressed = new Set();
  let isDragging = false;
  let isMenuOpen = false;
  let offsetX = 0, offsetY = 0;

  const maniaCat = document.createElement("div");
  maniaCat.id = "mania-cat";
  maniaCat.style.position = "absolute";
  maniaCat.style.top = "50px";
  maniaCat.style.left = "50px";
  maniaCat.style.cursor = "grab";
  maniaCat.style.touchAction = "none";

  const base = ["base", "Left's left", "Left's right", "Right's left", "Right's right"];
  base.forEach(name => {
    const img = document.createElement("img");
    img.src = name + ".png";
    img.id = name
      .replace("Left's ", "lefty-")
      .replace("Right's ", "righty-");
    img.alt = "";
    img.draggable = false;
    img.style.position = "absolute";
    img.style.top = "0";
    img.style.left = "0";
    img.style.pointerEvents = "auto";
    img.style.userDrag = "none";
    img.style.webkitUserDrag = "none";
    maniaCat.appendChild(img);
  });
  document.body.appendChild(maniaCat);

  const contextMenu = document.createElement("div");
  contextMenu.id = "context-menu";
  contextMenu.style.position = "absolute";
  contextMenu.style.background = "#333";
  contextMenu.style.color = "#fff";
  contextMenu.style.padding = "10px";
  contextMenu.style.borderRadius = "6px";
  contextMenu.style.display = "none";
  contextMenu.style.zIndex = "999";
  contextMenu.style.width = "220px";
  contextMenu.style.boxShadow = "0 4px 12px rgba(0,0,0,0.5)";
  contextMenu.style.fontFamily = "system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif";

  const label = document.createElement("label");
  label.innerHTML = 'Resize Mania Cat: <span id="resize-value">100%</span>';
  contextMenu.appendChild(label);

  const slider = document.createElement("input");
  slider.type = "range";
  slider.id = "resize-slider";
  slider.min = "20";
  slider.max = "300";
  slider.value = "100";
  slider.style.width = "100%";
  contextMenu.appendChild(slider);

  document.body.appendChild(contextMenu);
  const resizeValue = label.querySelector("#resize-value");

  // Keybinds
  const keyMap = {
    a: { side: "lefty", hand: "left", img: "L l" },
    s: { side: "lefty", hand: "left", img: "L d" },
    w: { side: "lefty", hand: "right", img: "L u" },
    d: { side: "lefty", hand: "right", img: "L r" },

    ArrowLeft: { side: "righty", hand: "left", img: "R l" },
    ArrowDown: { side: "righty", hand: "left", img: "R d" },
    ArrowUp: { side: "righty", hand: "right", img: "R u" },
    ArrowRight: { side: "righty", hand: "right", img: "R r" },
  };

  const comboMap = {
    "a+s": { side: "lefty", hand: "left", img: "L ld" },
    "w+d": { side: "lefty", hand: "right", img: "L ur" },
    "ArrowUp+ArrowRight": { side: "righty", hand: "right", img: "R ur" },
    "ArrowLeft+ArrowDown": { side: "righty", hand: "left", img: "R ld" },
  };

  function normalizeKey(k) {
    return (typeof k === "string" && k.length === 1) ? k.toLowerCase() : k;
  }

  function clearPresses() {
    maniaCat.querySelectorAll(".press").forEach(img => img.remove());
  }

  function addPressImage(name) {
    const img = document.createElement("img");
    img.src = name + ".png";
    img.className = "press";
    img.alt = "";
    img.draggable = false;
    img.style.position = "absolute";
    img.style.top = "0";
    img.style.left = "0";
    img.style.transform = `scale(${maniaCat.dataset.scale || 1})`;
    maniaCat.appendChild(img);
  }

  function updateHands() {
    clearPresses();
    ["lefty-left", "lefty-right", "righty-left", "righty-right"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = "block";
    });

    const handsCovered = {
      lefty: { left: false, right: false },
      righty: { left: false, right: false },
    };

    handleSide(["a", "s", "w", "d"], "lefty", handsCovered);
    handleSide(["ArrowLeft", "ArrowDown", "ArrowUp", "ArrowRight"], "righty", handsCovered);
  }

  function handleSide(keys, side, handsCovered) {
    const activeKeys = keys.filter(k => pressed.has(k));
    if (!activeKeys.length) return;

    // combos
    if (activeKeys.length >= 2) {
      for (let i = 0; i < activeKeys.length; i++) {
        for (let j = i + 1; j < activeKeys.length; j++) {
          const k1 = activeKeys[i], k2 = activeKeys[j];
          const combo = comboMap[`${k1}+${k2}`] || comboMap[`${k2}+${k1}`];
          if (combo && combo.side === side && !handsCovered[side][combo.hand]) {
            const idle = document.getElementById(`${side}-${combo.hand}`);
            if (idle) idle.style.display = "none";
            addPressImage(combo.img);
            handsCovered[side][combo.hand] = true;
          }
        }
      }
    }

    activeKeys.forEach(k => {
      const map = keyMap[k];
      if (map && map.side === side && !handsCovered[side][map.hand]) {
        const idle = document.getElementById(`${side}-${map.hand}`);
        if (idle) idle.style.display = "none";
        addPressImage(map.img);
        handsCovered[side][map.hand] = true;
      }
    });
  }

  document.addEventListener("keydown", e => {
    const k = normalizeKey(e.key);
    if (keyMap[k]) {
      if (k.startsWith("Arrow")) e.preventDefault();
      if (!pressed.has(k)) {
        pressed.add(k);
        updateHands();
      }
    }
  });

  document.addEventListener("keyup", e => {
    const k = normalizeKey(e.key);
    if (keyMap[k]) {
      pressed.delete(k);
      updateHands();
    }
  });

  // Dragging
  maniaCat.addEventListener("mousedown", e => {
    if (e.button !== 0) return;
    if (isMenuOpen) return;
    isDragging = true;
    offsetX = e.clientX - maniaCat.offsetLeft;
    offsetY = e.clientY - maniaCat.offsetTop;
    maniaCat.style.cursor = "grabbing";
    e.preventDefault();
  });

  document.addEventListener("mousemove", e => {
    if (!isDragging) return;
    maniaCat.style.left = (e.clientX - offsetX) + "px";
    maniaCat.style.top = (e.clientY - offsetY) + "px";
  });

  document.addEventListener("mouseup", () => {
    if (!isDragging) return;
    isDragging = false;
    maniaCat.style.cursor = "grab";
    savePos();
  });

  maniaCat.addEventListener("contextmenu", e => {
    e.preventDefault();
    openMenuAt(e.clientX, e.clientY);
  });

  function openMenuAt(x, y) {
    contextMenu.style.display = "block";
    contextMenu.style.left = x + "px";
    contextMenu.style.top = y + "px";
    isMenuOpen = true;
  }
  function closeMenu() {
    contextMenu.style.display = "none";
    isMenuOpen = false;
  }
  document.addEventListener("click", e => {
    if (isMenuOpen && !contextMenu.contains(e.target)) closeMenu();
  });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") closeMenu();
  });

  // Resizing
  slider.addEventListener("input", () => {
    const scale = slider.value / 100;
    maniaCat.dataset.scale = scale;
    ["base", "lefty-left", "lefty-right", "righty-left", "righty-right"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.transform = `scale(${scale})`;
    });
    maniaCat.querySelectorAll(".press").forEach(img => {
      img.style.transform = `scale(${scale})`;
    });
    resizeValue.textContent = slider.value + "%";
    localStorage.setItem("maniaCatScale", slider.value);
  });

  function savePos() {
    localStorage.setItem("maniaCatPos", JSON.stringify({
      left: maniaCat.style.left,
      top: maniaCat.style.top
    }));
  }
  function restorePos() {
    const saved = localStorage.getItem("maniaCatPos");
    if (saved) {
      try {
        const pos = JSON.parse(saved);
        if (pos.left) maniaCat.style.left = pos.left;
        if (pos.top) maniaCat.style.top = pos.top;
      } catch {}
    }
  }
  function restoreScale() {
    const saved = localStorage.getItem("maniaCatScale");
    if (saved) {
      slider.value = saved;
      slider.dispatchEvent(new Event("input"));
    } else {
      slider.dispatchEvent(new Event("input"));
    }
  }

  window.addEventListener("load", () => {
    restorePos();
    restoreScale();
  });
})();
