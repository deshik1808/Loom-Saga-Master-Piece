(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))r(o);new MutationObserver(o=>{for(const i of o)if(i.type==="childList")for(const s of i.addedNodes)s.tagName==="LINK"&&s.rel==="modulepreload"&&r(s)}).observe(document,{childList:!0,subtree:!0});function t(o){const i={};return o.integrity&&(i.integrity=o.integrity),o.referrerPolicy&&(i.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?i.credentials="include":o.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function r(o){if(o.ep)return;o.ep=!0;const i=t(o);fetch(o.href,i)}})();const O="loomSaga_cart";function m(){const a=localStorage.getItem(O);return a?JSON.parse(a):[]}function S(a){localStorage.setItem(O,JSON.stringify(a)),R()}function U(a){const e=m(),t=e.findIndex(i=>String(i.id)===String(a.id)),r=t>-1?e[t].quantity:0,o=a.stockQuantity??null;return o!==null&&r>=o?(w(o===0?`${a.name} is out of stock`:`Maximum available quantity (${o}) already in cart`),{success:!1,message:"Stock limit reached"}):(t>-1?(e[t].quantity+=1,e[t].stockQuantity=o):e.push({id:String(a.id),name:a.name,price:parseFloat(a.price),image:a.image||a.primaryImage||"",quantity:1,stockQuantity:o}),S(e),w(`${a.name} added to cart`),{success:!0,message:"Added"})}function J(a){const e=m().filter(t=>String(t.id)!==String(a));S(e),typeof window.renderCart=="function"&&window.renderCart()}function Q(a,e){const t=m(),r=t.findIndex(o=>String(o.id)===String(a));if(r>-1){const o=t[r].stockQuantity??null;e<=0?t.splice(r,1):o!==null&&e>o?(w(`Only ${o} available`),t[r].quantity=o):t[r].quantity=e,S(t)}return typeof window.renderCart=="function"&&window.renderCart(),{success:!0,message:"Updated"}}function K(){return m().reduce((a,e)=>a+e.price*e.quantity,0)}function _(){return m().reduce((a,e)=>a+e.quantity,0)}function R(){const a=document.getElementById("cartBadge"),e=document.getElementById("cartCount"),t=_();[a,e].filter(Boolean).forEach(r=>{r.textContent=t,r.style.display=t>0?"flex":"none"})}function G(a){return`Rs. ${a.toLocaleString("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2})}`}function w(a){const e=document.querySelector(".cart-notification");e&&e.remove();const t=document.createElement("div");t.className="cart-notification",t.innerHTML=`
    <span>${a}</span>
    <a href="cart.html" class="notification-link">View Cart</a>
  `,document.body.appendChild(t),requestAnimationFrame(()=>{t.classList.add("show")}),setTimeout(()=>{t.classList.remove("show"),setTimeout(()=>t.remove(),300)},3e3)}const T={getItems:m,saveItems:S,addItem:U,removeItem:J,updateQuantity:Q,getTotal:K,getItemCount:_,updateBadge:R,formatPrice:G,showNotification:w},q="loomSaga_wishlist";function h(){const a=localStorage.getItem(q);return a?JSON.parse(a):[]}function f(a){localStorage.setItem(q,JSON.stringify(a)),H()}function B(a){return h().some(e=>e.id===a)}function Y(a){const e=h(),t=e.findIndex(r=>r.id===a.id);return t>-1?(e.splice(t,1),f(e),b(`${a.name} removed from wishlist`),!1):(e.push(a),f(e),b(`${a.name} added to wishlist`),!0)}function V(a){if(!B(a.id)){const e=h();e.push(a),f(e),b(`${a.name} added to wishlist`)}}function X(a){const e=h().filter(t=>t.id!==a);f(e),typeof window.renderWishlist=="function"&&window.renderWishlist()}function M(){return h().length}function H(){const a=document.getElementById("wishlistBadge");if(a){const e=M();a.textContent=e,a.style.display=e>0?"flex":"none"}}function b(a){const e=document.querySelector(".wishlist-notification");e&&e.remove();const t=document.createElement("div");t.className="wishlist-notification",t.innerHTML=`
    <span>${a}</span>
    <a href="wishlist.html" class="notification-link">View Wishlist</a>
  `,document.body.appendChild(t),requestAnimationFrame(()=>{t.classList.add("show")}),setTimeout(()=>{t.classList.remove("show"),setTimeout(()=>t.remove(),300)},3e3)}const j={getItems:h,saveItems:f,isInWishlist:B,toggle:Y,addItem:V,removeItem:X,getCount:M,updateBadge:H,showNotification:b};function F(){const a=document.querySelectorAll(".reveal, .reveal-left, .reveal-right, .reveal-scale, .reveal-stagger");if(a.length===0)return;const e=new IntersectionObserver(t=>{t.forEach(r=>{r.isIntersecting&&(r.target.classList.add("revealed"),e.unobserve(r.target))})},{threshold:.1,rootMargin:"50px"});a.forEach(t=>e.observe(t))}function Z(){}function ee(){F()}const te={init:ee,initScrollReveal:F,initHeaderScroll:Z};class re{constructor(){this.products=[],this.categories=[],this.collections=[],this.filters={},this.isLoaded=!1,this.loadPromise=null,this.dataSource="none"}async init(){if(!this.isLoaded)return this.loadPromise?this.loadPromise:(this.loadPromise=Promise.all([this.loadProducts(),this.loadCategories(),this.loadCollections()]).then(()=>{this.isLoaded=!0,console.log(`ProductService: ${this.products.length} products loaded from ${this.dataSource}`)}),this.loadPromise)}async loadProducts(){try{const e=await fetch("/api/products");if(!e.ok)throw new Error(`API returned ${e.status}`);const r=(await e.json()).products||[];if(r.length>0){this.products=r.map(o=>this._normalizeApiProduct(o)),this.dataSource="api";return}console.warn("ProductService: WooCommerce returned 0 products, falling back to local JSON")}catch(e){console.warn("ProductService: API failed, falling back to local JSON",e.message)}try{const t=await(await fetch("/data/products.json")).json();this.products=(t.products||[]).map(r=>this._normalizeLocalProduct(r)),this.dataSource="local"}catch(e){console.error("ProductService: Local fallback also failed",e),this.products=[],this.dataSource="none"}}_normalizeApiProduct(e){var t,r,o,i,s;return{id:String(e.id),sku:e.sku||"",slug:e.slug||"",name:e.name||"",price:parseFloat(e.price)||0,regularPrice:parseFloat(e.regularPrice)||0,salePrice:parseFloat(e.salePrice)||0,description:e.description||"",shortDescription:e.shortDescription||"",images:{primary:e.primaryImage||"",gallery:e.images||[],placeholder:e.primaryImage||"https://placehold.co/400x500/e0e0e0/666?text=No+Image"},category:e.category||"uncategorized",categoryName:e.categoryName||"Uncategorized",categories:e.categories||[],tags:e.tags||[],inStock:e.inStock!==!1,stockQuantity:e.stockQuantity??null,manageStock:e.manageStock||!1,featured:e.featured||!1,newArrival:e.newArrival||!1,attributes:{color:typeof((t=e.attributes)==null?void 0:t.color)=="string"?{name:e.attributes.color,hex:null}:((r=e.attributes)==null?void 0:r.color)||null,fabric:((o=e.attributes)==null?void 0:o.fabric)||null,occasion:((i=e.attributes)==null?void 0:i.occasion)||[],raw:((s=e.attributes)==null?void 0:s.raw)||[]},checkoutUrl:e.checkoutUrl||""}}_normalizeLocalProduct(e){var t,r,o;return{id:String(e.id),sku:e.sku||"",slug:e.slug||"",name:e.name||"",price:e.price||0,regularPrice:e.compareAtPrice||0,salePrice:0,description:e.description||"",shortDescription:e.shortDescription||"",images:{primary:((t=e.images)==null?void 0:t.primary)||"",gallery:((r=e.images)==null?void 0:r.gallery)||[],placeholder:((o=e.images)==null?void 0:o.placeholder)||""},category:e.category||"uncategorized",categoryName:"",categories:(e.collections||[]).map(i=>({slug:i,name:i})),tags:e.tags||[],inStock:e.inStock!==!1,stockQuantity:e.quantity??null,manageStock:e.quantity!=null,featured:e.featured||!1,newArrival:e.newArrival||!1,attributes:e.attributes||{},checkoutUrl:""}}async loadCategories(){try{const t=await(await fetch("/data/categories.json")).json();this.categories=t.categories||[],this.filters=t.filters||{}}catch(e){console.error("ProductService: Failed to load categories",e),this.categories=[],this.filters={}}}async loadCollections(){try{const t=await(await fetch("/data/collections.json")).json();this.collections=t.collections||[]}catch(e){console.error("ProductService: Failed to load collections",e),this.collections=[]}}getAllProducts(){return this.products}getProductById(e){return this.products.find(t=>String(t.id)===String(e))||null}getProductBySlug(e){return this.products.find(t=>t.slug===e)||null}getProductsByCategory(e){return this.products.filter(t=>t.category===e||t.categories.some(r=>r.slug===e))}getFeaturedProducts(e=6){return this.products.filter(t=>t.featured).slice(0,e)}getNewArrivals(e=8){return this.products.filter(t=>t.newArrival).slice(0,e)}getRelatedProducts(e,t=4){const r=this.getProductById(e);return r?r.relatedProducts&&r.relatedProducts.length>0?r.relatedProducts.map(o=>this.getProductById(o)).filter(o=>o!==null).slice(0,t):this.products.filter(o=>o.id!==r.id&&o.category===r.category).slice(0,t):[]}filterProducts(e={}){let t=[...this.products];if(e.category&&(t=t.filter(r=>r.category===e.category||r.categories.some(o=>o.slug===e.category))),e.subcategory&&(t=t.filter(r=>r.subcategory===e.subcategory)),e.colors&&e.colors.length>0&&(t=t.filter(r=>{var i,s,n,c,l;const o=typeof((i=r.attributes)==null?void 0:i.color)=="object"?(c=(n=(s=r.attributes)==null?void 0:s.color)==null?void 0:n.name)==null?void 0:c.toLowerCase():(((l=r.attributes)==null?void 0:l.color)||"").toLowerCase();return e.colors.some(u=>{var d;return(o==null?void 0:o.includes(u.toLowerCase()))||((d=r.tags)==null?void 0:d.some(y=>y.toLowerCase()===u.toLowerCase()))})})),e.fabrics&&e.fabrics.length>0&&(t=t.filter(r=>{var i;const o=typeof((i=r.attributes)==null?void 0:i.fabric)=="string"?r.attributes.fabric.toLowerCase():"";return e.fabrics.some(s=>o.includes(s.toLowerCase()))})),e.occasions&&e.occasions.length>0&&(t=t.filter(r=>{var i;const o=((i=r.attributes)==null?void 0:i.occasion)||[];return e.occasions.some(s=>o.some(n=>n.toLowerCase()===s.toLowerCase()))})),e.priceRange){const{min:r=0,max:o=1/0}=e.priceRange;t=t.filter(i=>i.price>=r&&i.price<=o)}return e.inStock&&(t=t.filter(r=>r.inStock)),e.collection&&(t=t.filter(r=>{var o,i;return((o=r.categories)==null?void 0:o.some(s=>s.slug===e.collection))||((i=r.collections)==null?void 0:i.includes(e.collection))})),t}sortProducts(e,t="newest"){const r=[...e];switch(t){case"newest":return r.sort((o,i)=>new Date(i.createdAt||0)-new Date(o.createdAt||0));case"price-low":return r.sort((o,i)=>o.price-i.price);case"price-high":return r.sort((o,i)=>i.price-o.price);case"name-az":return r.sort((o,i)=>o.name.localeCompare(i.name));case"name-za":return r.sort((o,i)=>i.name.localeCompare(o.name));case"rating":return r.sort((o,i)=>{var s,n;return(((s=i.ratings)==null?void 0:s.average)||0)-(((n=o.ratings)==null?void 0:n.average)||0)});default:return r}}searchProducts(e){if(!e||e.trim().length<2)return[];const t=e.toLowerCase().trim().split(/\s+/);return this.products.filter(r=>{var s,n,c,l;const o=typeof((s=r.attributes)==null?void 0:s.color)=="object"?r.attributes.color.name:(n=r.attributes)==null?void 0:n.color,i=[r.name,r.shortDescription,r.description,r.category,r.categoryName,...r.tags||[],o,(c=r.attributes)==null?void 0:c.fabric,...((l=r.attributes)==null?void 0:l.occasion)||[]].filter(Boolean).join(" ").toLowerCase();return t.every(u=>i.includes(u))})}getAllCategories(){return this.categories}getCategoryById(e){return this.categories.find(t=>t.id===e)||null}getCategoryBySlug(e){return this.categories.find(t=>t.slug===e)||null}getFeaturedCategories(){return this.categories.filter(e=>e.featured)}getAllCollections(){return this.collections}getCollectionById(e){return this.collections.find(t=>t.id===e)||null}getCollectionBySlug(e){return this.collections.find(t=>t.slug===e)||null}getProductsInCollection(e,t=null){const r=this.getCollectionById(e);if(!r)return[];let o=(r.productIds||[]).map(i=>this.getProductById(i)).filter(i=>i!==null);return t&&(o=o.slice(0,t)),o}getHomepageCollections(){return this.collections.filter(e=>e.showOnHomepage).sort((e,t)=>e.sortOrder-t.sortOrder)}getFilters(){return this.filters}getFilterOptionsForCategory(e){const t=this.getProductsByCategory(e);return{colors:this.getColorCounts(t),fabrics:this.getFabricCounts(t),occasions:this.getOccasionCounts(t),priceRanges:this.getPriceRangeCounts(t)}}getColorCounts(e){const t={};return e.forEach(r=>{var i,s;const o=typeof((i=r.attributes)==null?void 0:i.color)=="object"?r.attributes.color.name:(s=r.attributes)==null?void 0:s.color;o&&(t[o]=(t[o]||0)+1)}),t}getFabricCounts(e){const t={};return e.forEach(r=>{var i;const o=(i=r.attributes)==null?void 0:i.fabric;o&&(t[o]=(t[o]||0)+1)}),t}getOccasionCounts(e){const t={};return e.forEach(r=>{var o;(((o=r.attributes)==null?void 0:o.occasion)||[]).forEach(i=>{t[i]=(t[i]||0)+1})}),t}getPriceRangeCounts(e){const t=this.filters.priceRange||[],r={};return t.forEach(o=>{const i=o.min||0,s=o.max||1/0;r[o.id]=e.filter(n=>n.price>=i&&n.price<=s).length}),r}formatPrice(e){return`₹${e.toLocaleString("en-IN")}`}getProductCount(){return this.products.length}parseUrlFilters(e){const t=new URLSearchParams(e),r={};return t.has("category")&&(r.category=t.get("category")),t.has("subcategory")&&(r.subcategory=t.get("subcategory")),t.has("color")&&(r.colors=t.getAll("color")),t.has("fabric")&&(r.fabrics=t.getAll("fabric")),t.has("occasion")&&(r.occasions=t.getAll("occasion")),t.has("collection")&&(r.collection=t.get("collection")),(t.has("minPrice")||t.has("maxPrice"))&&(r.priceRange={min:parseInt(t.get("minPrice"))||0,max:parseInt(t.get("maxPrice"))||1/0}),t.has("inStock")&&(r.inStock=t.get("inStock")==="true"),r}buildFilterUrl(e){var r,o;const t=new URLSearchParams;return e.category&&t.set("category",e.category),e.subcategory&&t.set("subcategory",e.subcategory),e.colors&&e.colors.forEach(i=>t.append("color",i)),e.fabrics&&e.fabrics.forEach(i=>t.append("fabric",i)),e.occasions&&e.occasions.forEach(i=>t.append("occasion",i)),e.collection&&t.set("collection",e.collection),(r=e.priceRange)!=null&&r.min&&t.set("minPrice",e.priceRange.min),(o=e.priceRange)!=null&&o.max&&e.priceRange.max!==1/0&&t.set("maxPrice",e.priceRange.max),e.inStock&&t.set("inStock","true"),t.toString()}}const g=new re;typeof window<"u"&&(window.ProductService=g);class I{static getOptimizedImage(e,t=800,r=75){return e?(e.includes("placehold.co")||e.startsWith("http")&&!e.includes(window.location.hostname),e):"https://placehold.co/800x1000/e0e0e0/666?text=No+Image"}static renderCard(e,t={}){var A,N;const{showWishlist:r=!0,lazy:o=!0}=t,i=((A=e.images)==null?void 0:A.primary)||e.primaryImage||((N=e.images)==null?void 0:N.placeholder),s=this.getOptimizedImage(i,600),n=o?'loading="lazy"':'loading="eager"',c=e.inStock===!1,l=Number(e.regularPrice)||0,u=Number(e.salePrice)||0,d=u>0&&l>u,y=d?u:Number(e.price)||0;return`
      <article class="product-card${c?" product-card--out-of-stock":""}" 
        data-product-id="${e.id}" 
        data-product-name="${this.escapeHtml(e.name)}" 
        data-product-price="${y}" 
        data-product-regular-price="${l}"
        data-product-sale-price="${u}"
        data-product-image="${s}"
        data-stock-quantity="${e.stockQuantity??""}"
        data-in-stock="${e.inStock!==!1}">
        <a href="product-detail.html?id=${e.id}" class="product-card-link">
          <div class="product-card-image luxury-shimmer">
            <img src="${s}" 
                 alt="${this.escapeHtml(e.name)}" 
                 ${n}
                 onload="this.parentElement.classList.remove('luxury-shimmer')">
            ${c?'<span class="product-badge product-badge--oos">Out of Stock</span>':""}
            ${d?'<span class="product-badge product-badge--sale">Sale</span>':""}
            ${r?this.renderWishlistButton():""}
          </div>
          <div class="product-card-info">
            <h2 class="product-card-name">${this.escapeHtml(e.name)}</h2>
            <p class="product-card-price">
              ${d?`<span class="product-card-price-regular">${this.formatPrice(l)}</span>`:""}
              <span class="product-card-price-current${d?" product-card-price-current--sale":""}">${this.formatPrice(y)}</span>
            </p>
          </div>
        </a>
      </article>
    `}static renderWishlistButton(){return`
      <button class="product-wishlist-btn" aria-label="Add to Wishlist">
        <img src="assets/icons/heart-outline.png" alt="" class="heart-outline">
        <img src="assets/icons/heart-filled.png" alt="" class="heart-filled">
      </button>
    `}static renderGrid(e,t,r={}){const{append:o=!1,animate:i=!0,emptyMessage:s="No products found."}=r,n=typeof t=="string"?document.querySelector(t):t;if(!n){console.error("ProductRenderer: Container not found");return}if(!e||e.length===0){n.innerHTML=`
        <div class="products-empty-state">
          <p>${s}</p>
        </div>
      `;return}const c=e.map(l=>this.renderCard(l)).join("");o?n.insertAdjacentHTML("beforeend",c):n.innerHTML=c,i&&n.classList.add("product-grid-animated"),this.initializeWishlistButtons(n)}static renderHorizontalCard(e){var n,c,l;const t=((n=e.images)==null?void 0:n.thumbnail)||((c=e.images)==null?void 0:c.placeholder)||((l=e.images)==null?void 0:l.primary)||e.primaryImage,r=Number(e.regularPrice)||0,o=Number(e.salePrice)||0,i=o>0&&r>o,s=i?o:Number(e.price)||0;return`
      <a href="product-detail.html?id=${e.id}" class="search-product-card">
        <img src="${t}" alt="${this.escapeHtml(e.name)}" class="search-product-card__image" loading="lazy">
        <div class="search-product-card__info">
          <p class="search-product-card__name">${this.escapeHtml(e.name)}</p>
          <p class="search-product-card__price">
            ${i?`<span class="search-product-card__price-regular">${this.formatPrice(r)}</span>`:""}
            <span class="search-product-card__price-current${i?" search-product-card__price-current--sale":""}">${this.formatPrice(s)}</span>
          </p>
        </div>
      </a>
    `}static renderSearchResults(e,t,r){const o=typeof t=="string"?document.querySelector(t):t,i=typeof r=="string"?document.querySelector(r):r;o&&e.categories&&(o.innerHTML=e.categories.slice(0,5).map(s=>`
          <li>
            <a href="${s.slug}.html" class="search-suggestion-link">
              ${this.escapeHtml(s.name)}
            </a>
          </li>
        `).join("")),i&&e.products&&(i.innerHTML=e.products.slice(0,4).map(s=>this.renderHorizontalCard(s)).join(""))}static renderCartItem(e){const t=e.image||"https://placehold.co/80x100/e0e0e0/666?text=No+Image",r=this.getOptimizedImage(t,200),o=e.price*e.quantity,i=e.stockQuantity??null,s=i!==null&&e.quantity>=i;return`
      <div class="cart-drawer-item" data-product-id="${e.id}">
        <div class="cart-item-image">
          <img src="${r}" alt="${this.escapeHtml(e.name)}">
        </div>
        <div class="cart-item-details">
          <p class="cart-item-name">${this.escapeHtml(e.name)}</p>
          <div class="cart-item-quantity">
            <button class="qty-btn qty-minus" data-action="decrease">-</button>
            <span class="qty-value">${e.quantity}</span>
            <button class="qty-btn qty-plus" data-action="increase"${s?' disabled title="Stock limit reached"':""}>+</button>
          </div>
        </div>
        <div class="cart-item-price">
          <p>${this.formatPrice(o)}</p>
          <button class="cart-item-remove" data-action="remove" aria-label="Remove item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>
    `}static renderFilters(e,t={}){let r="";return e.color&&e.color.length>0&&(r+=`
        <div class="filter-group">
          <h4 class="filter-group-title">Color</h4>
          <div class="filter-options">
            ${e.color.map(o=>{var i;return`
              <label class="filter-checkbox">
                <input type="checkbox" name="color" value="${o.id}" 
                  ${(i=t.colors)!=null&&i.includes(o.id)?"checked":""}>
                <span class="color-swatch-small" style="background-color: ${o.hex}"></span>
                ${o.name}
              </label>
            `}).join("")}
          </div>
        </div>
      `),e.fabric&&e.fabric.length>0&&(r+=`
        <div class="filter-group">
          <h4 class="filter-group-title">Fabric</h4>
          <div class="filter-options">
            ${e.fabric.map(o=>{var i;return`
              <label class="filter-checkbox">
                <input type="checkbox" name="fabric" value="${o.id}"
                  ${(i=t.fabrics)!=null&&i.includes(o.id)?"checked":""}>
                ${o.name}
              </label>
            `}).join("")}
          </div>
        </div>
      `),e.occasion&&e.occasion.length>0&&(r+=`
        <div class="filter-group">
          <h4 class="filter-group-title">Occasion</h4>
          <div class="filter-options">
            ${e.occasion.map(o=>{var i;return`
              <label class="filter-checkbox">
                <input type="checkbox" name="occasion" value="${o.id}"
                  ${(i=t.occasions)!=null&&i.includes(o.id)?"checked":""}>
                ${o.name}
              </label>
            `}).join("")}
          </div>
        </div>
      `),e.priceRange&&e.priceRange.length>0&&(r+=`
        <div class="filter-group">
          <h4 class="filter-group-title">Price Range</h4>
          <div class="filter-options">
            ${e.priceRange.map(o=>`
              <label class="filter-checkbox">
                <input type="checkbox" name="price" value="${o.id}"
                  ${t.priceRangeId===o.id?"checked":""}>
                ${o.name}
              </label>
            `).join("")}
          </div>
        </div>
      `),r}static initializeWishlistButtons(e){e.querySelectorAll(".product-wishlist-btn").forEach(r=>{r.addEventListener("click",o=>{o.preventDefault(),o.stopPropagation();const i=r.closest(".product-card");if(!i)return;const s={id:i.dataset.productId,name:i.dataset.productName,price:parseFloat(i.dataset.productPrice),regularPrice:parseFloat(i.dataset.productRegularPrice)||0,salePrice:parseFloat(i.dataset.productSalePrice)||0,image:i.dataset.productImage};if(window.WishlistManager){const n=window.WishlistManager.toggle||window.WishlistManager.toggleItem;n&&(n.call(window.WishlistManager,s)?r.classList.add("active"):r.classList.remove("active"))}})})}static escapeHtml(e){if(!e)return"";const t=document.createElement("div");return t.textContent=e,t.innerHTML}static formatPrice(e){return`Rs.${e.toLocaleString("en-IN")}/-`}}typeof window<"u"&&(window.ProductRenderer=I);const oe={init(){document.querySelectorAll("#newsletterForm, .insights-newsletter-form").forEach(e=>{e.addEventListener("submit",t=>this.handleSubmit(t))}),console.log("Loom Saga: NewsletterManager initialized")},async handleSubmit(a){a.preventDefault();const e=a.target,t=e.querySelector('input[type="email"]'),r=e.querySelector('button[type="submit"]'),o=t.value;if(!o)return;const i=r.textContent;r.disabled=!0,r.textContent="Joining...";try{const s=await fetch("/api/newsletter",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:o})}),n=await s.json();if(s.ok)this.showSuccess(e,t,r);else throw console.error("Server responded with error:",n),new Error(n.error||"Failed to subscribe")}catch(s){console.error("Newsletter Error Details:",s),this.showError(r,i)}},showSuccess(a,e,t){e.value="",a.style.transition="opacity 0.4s ease",a.style.opacity="0",setTimeout(()=>{a.innerHTML=`
        <div class="newsletter-success-premium">
          <svg class="success-tick" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <span>Thanks for subscribing</span>
        </div>
      `,a.style.opacity="1"},400)},showError(a,e){a.textContent="Error!",a.style.backgroundColor="#f44336",setTimeout(()=>{a.disabled=!1,a.textContent=e,a.style.backgroundColor=""},3e3)}},C="loom_saga_user",x="loom_jwt_token",L="loom_jwt_expires";function E(a,e,t){try{localStorage.setItem(C,JSON.stringify(a)),e&&localStorage.setItem(x,e),t&&localStorage.setItem(L,t.toString())}catch{}}function v(){try{const a=localStorage.getItem(C);return a?JSON.parse(a):null}catch{return null}}function P(){try{return localStorage.getItem(x)||null}catch{return null}}function ae(){try{const a=localStorage.getItem(L);return a?parseInt(a,10):null}catch{return null}}function p(){try{localStorage.removeItem(C),localStorage.removeItem(x),localStorage.removeItem(L)}catch{}}function $(){return!!v()&&!!P()}function ie(){const a=ae();return a?Date.now()>=a-300*1e3:!0}async function k(a,e,t=!1){const r={"Content-Type":"application/json"};if(t){const s=P();s&&(r.Authorization=`Bearer ${s}`)}const o=await fetch(a,{method:"POST",headers:r,body:JSON.stringify(e)}),i=await o.json().catch(()=>({}));return{ok:o.ok,status:o.status,data:i}}async function z(){const a=P();if(!a)return!1;try{const{ok:e,data:t}=await k("/api/auth/refresh-token",{token:a});if(e&&t.success&&t.token){const r=v();return E(r,t.token,t.expiresAt),!0}return p(),!1}catch(e){return console.error("Token refresh failed:",e),p(),!1}}async function se(a,e){const{ok:t,data:r}=await k("/api/auth/login",{email:a,password:e});return t&&r.success?(E(r.user,r.token,r.expiresAt),{success:!0,user:r.user}):{success:!1,error:r.error||"Login failed. Please try again."}}async function ne({email:a,password:e,firstName:t,lastName:r}){const{ok:o,status:i,data:s}=await k("/api/auth/register",{email:a,password:e,firstName:t,lastName:r});return o&&s.success?(s.token&&E(s.user,s.token,s.expiresAt),{success:!0,user:s.user,autoLoggedIn:!!s.token}):{success:!1,error:s.error||"Registration failed. Please try again.",isDuplicate:i===409}}async function ce(a){const{ok:e,data:t}=await k("/api/auth/forgot-password",{email:a});return{success:!0,message:t.message||"If an account exists with this email, you will receive a password reset link shortly."}}function le(){p(),window.dispatchEvent(new CustomEvent("loom:auth:logout"))}function W(){const a=v(),e=document.getElementById("accountBtn"),t=document.querySelector('.mobile-menu__secondary-link[href="login.html"]');if(a){if(e&&(e.href="my-account.html",e.setAttribute("aria-label",`Account: ${a.displayName}`)),t){t.href="my-account.html";const r=t.querySelector("span");r&&(r.textContent="MY ACCOUNT")}}else if(e&&(e.href="login.html",e.setAttribute("aria-label","Account")),t){t.href="login.html";const r=t.querySelector("span");r&&(r.textContent="LOG IN")}}async function ue(){$()&&ie()&&(await z()||p()),W();const a=window.location.pathname.split("/").pop()||"",e=["login.html","register.html"];if($()&&e.includes(a)){window.location.href="my-account.html";return}}const D={init:ue,login:se,register:ne,forgotPassword:ce,logout:le,getSession:v,getToken:P,isLoggedIn:$,clearSession:p,updateHeaderUI:W,refreshToken:z};window.CartManager=T;window.WishlistManager=j;window.ProductService=g;window.ProductRenderer=I;window.AuthManager=D;document.addEventListener("DOMContentLoaded",async()=>{te.init(),oe.init(),T.updateBadge(),j.updateBadge(),D.init();try{await g.init(),console.log(`Loom Saga: ${g.getProductCount()} products loaded`)}catch(a){console.warn("Loom Saga: Product data not available",a)}console.log("Loom Saga: Modules initialized")});document.addEventListener("DOMContentLoaded",async()=>{const a=document.querySelector(".products-page");if(!a)return;const e=a.dataset.category;if(!e){console.warn("Category page detected but no data-category attribute found");return}await g.init();const t=g.getProductsByCategory(e);console.log(`Category page (${e}): ${t.length} products found`);const r=document.querySelector(".products-grid");if(!r){console.warn("Products grid not found on page");return}r.innerHTML="",I.renderGrid(t,r),t.length===0&&(r.innerHTML=`
      <div style="grid-column: 1/-1; text-align:center; padding:3rem 1rem;">
        <p style="font-family:var(--font-heading); font-size:1.2rem; color:#555;">
          No products found in this category
        </p>
      </div>
    `)});export{D as A};
