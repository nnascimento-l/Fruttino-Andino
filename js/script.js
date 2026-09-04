
    const navbar = document.getElementById("navbar");

    const scrollBar = document.getElementById("scrollBar");



    window.addEventListener("scroll", () => {

      navbar.classList.toggle("scrolled", window.scrollY > 40);

      const h = document.documentElement.scrollHeight - window.innerHeight;

      const pct = h > 0 ? (window.scrollY / h) * 100 : 0;

      scrollBar.style.width = pct + "%";

    }, { passive: true });



    const revealAll = new IntersectionObserver((entries) => {

      entries.forEach((e) => {

        if (e.isIntersecting) {

          e.target.classList.add("visible");

          revealAll.unobserve(e.target);

        }

      });

    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });



    document.querySelectorAll(".reveal").forEach((el) => revealAll.observe(el));



    const scrollSpyTargets = document.querySelectorAll("header[id], section[id]");

    const allNavLinks = document.querySelectorAll(".nav-links a[href^=\"#\"]");



    const navSpy = new IntersectionObserver((entries) => {

      entries.forEach((entry) => {

        if (!entry.isIntersecting) return;

        allNavLinks.forEach((l) => l.classList.remove("nav-active"));

        const id = entry.target.id;

        const match = document.querySelector(`.nav-links a[href=\"#${id}\"]`);

        if (match) match.classList.add("nav-active");

      });

    }, { threshold: 0.35, rootMargin: "-12% 0px -55% 0px" });



    scrollSpyTargets.forEach((t) => navSpy.observe(t));

    const homeNav = document.querySelector(".nav-links a[href=\"#home\"]");
    if (homeNav && window.scrollY < 120) {
      allNavLinks.forEach((l) => l.classList.remove("nav-active"));
      homeNav.classList.add("nav-active");
    }



    const CART_KEY = "fruttino_cart_v2";

    const PRODUCTS = {
      chirimoya: { name: "Chirimoya de Quillota", price: 3490 },
      morango: { name: "Morango de Maipo", price: 3490 },
      magui: { name: "Magui Patagónico", price: 3490 },
      manzana: { name: "Manzana de Quillota", price: 3490 }
    };

    const fmtMoney = (n) =>
      new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(n);

    function loadCart() {
      try {
        const raw = localStorage.getItem(CART_KEY);
        const arr = raw ? JSON.parse(raw) : [];
        return Array.isArray(arr) ? arr : [];
      } catch {
        return [];
      }
    }

    function saveCart(lines) {
      localStorage.setItem(CART_KEY, JSON.stringify(lines));
    }

    let cartLines = loadCart();

    const cartLinesEl = document.getElementById("cartLines");
    const cartTotalEl = document.getElementById("cartTotal");
    const cartBadge = document.getElementById("cartBadge");
    const cartDrawer = document.getElementById("cartDrawer");
    const cartOverlay = document.getElementById("cartOverlay");
    const fabCartBtn = document.getElementById("fabCartBtn");
    const cartToast = document.getElementById("cartToast");
    const orderModal = document.getElementById("orderModal");
    const cartCheckoutBtn = document.getElementById("cartCheckoutBtn");
    const orderModalClose = document.getElementById("orderModalClose");
    const cartCloseBtn = document.getElementById("cartCloseBtn");

    function totalQty() {
      return cartLines.reduce((s, l) => s + l.qty, 0);
    }

    function totalPrice() {
      return cartLines.reduce((s, l) => {
        const p = PRODUCTS[l.id];
        return s + (p ? p.price * l.qty : 0);
      }, 0);
    }

    function renderCart() {
      const tq = totalQty();
      cartBadge.textContent = String(tq);
      cartBadge.style.display = tq > 0 ? "flex" : "none";
      cartTotalEl.textContent = fmtMoney(totalPrice());

      cartCheckoutBtn.disabled = !cartLines.length;

      if (!cartLines.length) {
        cartLinesEl.innerHTML = "<div class=\"cart-empty\">Tu carrito está vacío.<br>Agrega un sabor desde la sección Sabores.</div>";
        return;
      }

      const frag = document.createDocumentFragment();
      cartLines.forEach((line) => {
        const p = PRODUCTS[line.id];
        if (!p || line.qty < 1) return;
        const row = document.createElement("div");
        row.className = "cart-line";
        row.dataset.id = line.id;
        row.innerHTML =
          "<div><div class=\"cart-line-name\">" + p.name +
          "</div><div class=\"cart-line-meta\">" + fmtMoney(p.price) + " c/u · Subtotal: " +
          fmtMoney(p.price * line.qty) + "</div></div><div class=\"cart-line-actions\"><div class=\"cart-qty-row\">" +
          "<button type=\"button\" class=\"cart-qty-btn\" data-act=\"minus\" aria-label=\"Menos\">−</button>" +
          "<span style=\"min-width:22px;text-align:center;font-weight:700;font-size:0.9rem;\">" + line.qty +
          "</span><button type=\"button\" class=\"cart-qty-btn\" data-act=\"plus\" aria-label=\"Más\">+</button></div>" +
          "<button type=\"button\" class=\"cart-remove\" data-act=\"remove\" aria-label=\"Eliminar producto\">✕</button></div>";
        row.querySelectorAll("[data-act]").forEach((btn) => {
          btn.addEventListener("click", onCartLineAction);
          btn.dataset.id = line.id;
        });
        frag.appendChild(row);
      });
      cartLinesEl.innerHTML = "";
      cartLinesEl.appendChild(frag);
    }

    function persist() {
      cartLines = cartLines.filter((l) => l.qty > 0 && PRODUCTS[l.id]);
      saveCart(cartLines);
      renderCart();
    }

    function addProduct(id) {
      if (!PRODUCTS[id]) return;
      const existing = cartLines.find((l) => l.id === id);
      if (existing) existing.qty += 1;
      else cartLines.push({ id, qty: 1 });
      persist();
      cartToast.classList.add("show");
      clearTimeout(addProduct._toastT);
      addProduct._toastT = setTimeout(() => cartToast.classList.remove("show"), 2000);
    }

    function onCartLineAction(ev) {
      const btn = ev.currentTarget;
      const id = btn.dataset.id;
      const act = btn.dataset.act;
      const line = cartLines.find((l) => l.id === id);
      if (!line) return;
      if (act === "plus") line.qty += 1;
      if (act === "minus") line.qty -= 1;
      if (act === "remove" || line.qty < 1) {
        cartLines = cartLines.filter((l) => l.id !== id);
      }
      persist();
    }

    document.querySelectorAll("[data-cart-add]").forEach((b) => {
      b.addEventListener("click", () => addProduct(b.getAttribute("data-cart-add")));
    });

    function setCartOpen(open) {
      cartDrawer.classList.toggle("open", open);
      cartOverlay.classList.toggle("open", open);
      document.body.classList.toggle("cart-open", open);
      fabCartBtn.setAttribute("aria-expanded", open ? "true" : "false");
      cartDrawer.setAttribute("aria-hidden", open ? "false" : "true");
    }

    fabCartBtn.addEventListener("click", () => setCartOpen(true));
    cartOverlay.addEventListener("click", () => setCartOpen(false));
    cartCloseBtn.addEventListener("click", () => setCartOpen(false));

    function openOrderModal() {
      orderModal.classList.add("open");
      orderModal.setAttribute("aria-hidden", "false");
      document.body.classList.add("modal-open");
      setCartOpen(false);
    }

    function closeOrderModal() {
      orderModal.classList.remove("open");
      orderModal.setAttribute("aria-hidden", "true");
      document.body.classList.remove("modal-open");
    }

    cartCheckoutBtn.addEventListener("click", openOrderModal);
    orderModalClose.addEventListener("click", closeOrderModal);
    orderModal.addEventListener("click", (e) => {
      if (e.target === orderModal) closeOrderModal();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        setCartOpen(false);
        closeOrderModal();
      }
    });

    // === MENU MOBILE HAMBURGER ===
    const hamburgerBtn = document.getElementById("hamburgerBtn");
    const mobileMenu = document.getElementById("mobileMenu");

    function setMenuOpen(open) {
      hamburgerBtn.classList.toggle("open", open);
      mobileMenu.classList.toggle("open", open);
      mobileMenu.setAttribute("aria-hidden", open ? "false" : "true");
      hamburgerBtn.setAttribute("aria-expanded", open ? "true" : "false");
      document.body.style.overflow = open ? "hidden" : "";
    }

    hamburgerBtn.addEventListener("click", () => {
      const isOpen = mobileMenu.classList.contains("open");
      setMenuOpen(!isOpen);
    });

    document.querySelectorAll(".mobile-nav-link").forEach(link => {
      link.addEventListener("click", () => setMenuOpen(false));
    });

    // === MODAL MAIORIDADE ===
    const ageModal = document.getElementById("ageModal");
    const ageYes = document.getElementById("ageYes");
    const ageNo = document.getElementById("ageNo");

    if (!sessionStorage.getItem("age_verified")) {
      document.body.style.overflow = "hidden";
    } else {
      ageModal.classList.add("hidden");
    }

    ageYes.addEventListener("click", () => {
      sessionStorage.setItem("age_verified", "1");
      ageModal.classList.add("hidden");
      document.body.style.overflow = "";
    });

    ageNo.addEventListener("click", () => {
      window.location.href = "https://www.minsal.cl";
    });

    renderCart();

    const geoBtn = document.getElementById("geoBtn");
    const geoMapWrap = document.getElementById("geoMapWrap");
    const tiendasGrid = document.getElementById("tiendasGrid");
    const geoMsgOk = document.getElementById("geoMsgOk");
    const geoMsgInfo = document.getElementById("geoMsgInfo");

    geoBtn.addEventListener("click", () => {
      const showStores = (ok) => {
        geoMapWrap.classList.add("show");
        geoMapWrap.removeAttribute("aria-hidden");
        tiendasGrid.classList.add("show");
        geoMsgOk.classList.toggle("show", !!ok);
        geoMsgInfo.classList.toggle("show", !ok);
      };

      if (!navigator.geolocation) {
        showStores(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        () => showStores(true),
        () => showStores(false),
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 }
      );
    });

