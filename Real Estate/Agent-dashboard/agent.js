// ====================== SEARCH FUNCTIONALITY ======================
document.getElementById("searchInput").addEventListener("keyup", function () {
    const filter = this.value.toLowerCase();
    const rows = document.querySelectorAll("#propertyTable tbody tr");
    rows.forEach(row => {
        row.style.display = row.innerText.toLowerCase().includes(filter) ? "" : "none";
    });
});

// ====================== MODAL FUNCTIONALITY ======================
const addModal = document.getElementById("addPropertyModal");
const galleryModal = document.getElementById("imageGalleryModal");
const openAddBtn = document.querySelector(".menu a:nth-child(2)");
const mainContent = document.getElementById("mainContent");

// Open Add Property Modal
openAddBtn.addEventListener("click", () => {
    addModal.style.display = "flex";
    mainContent.style.filter = "blur(3px)";
});

// Close Add Property Modal
const closeAddBtn = document.querySelector("#addPropertyModal .closeModal");
closeAddBtn.addEventListener("click", () => {
    addModal.style.display = "none";
    mainContent.style.filter = "none";
});

// Close gallery modal
const closeGalleryBtn = document.getElementById("closeGallery");
closeGalleryBtn.addEventListener("click", () => {
    galleryModal.style.display = "none";
    mainContent.style.filter = "none";
});

// Close modal when clicking outside
window.addEventListener("click", (e) => {
    if (e.target === addModal) {
        addModal.style.display = "none";
        mainContent.style.filter = "none";
    }
    if (e.target === galleryModal) {
        galleryModal.style.display = "none";
        mainContent.style.filter = "none";
    }
});

// ====================== IMAGE PREVIEW ======================
function previewMultipleImages(input, previewContainerId) {
    const container = document.getElementById(previewContainerId);
    container.innerHTML = "";

    Array.from(input.files).forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const wrapper = document.createElement("div");
            wrapper.classList.add("preview-wrapper");

            const img = document.createElement("img");
            img.src = e.target.result;
            wrapper.appendChild(img);

            const removeBtn = document.createElement("span");
            removeBtn.classList.add("remove-img");
            removeBtn.innerHTML = "&times;";
            removeBtn.addEventListener("click", () => {
                const dt = new DataTransfer();
                Array.from(input.files).forEach((f, i) => { if(i !== index) dt.items.add(f); });
                input.files = dt.files;
                previewMultipleImages(input, previewContainerId);
            });

            wrapper.appendChild(removeBtn);
            container.appendChild(wrapper);
        };
        reader.readAsDataURL(file);
    });
}

document.getElementById("photoUpload").addEventListener("change", function() {
    previewMultipleImages(this, "photoPreviewContainer");
});
document.getElementById("mapUpload").addEventListener("change", function() {
    previewMultipleImages(this, "mapPreviewContainer");
});

// ====================== ADD PROPERTY TO TABLE ======================
// ====================== ADD PROPERTY TO TABLE ======================
document.getElementById("propertyForm").addEventListener("submit", function(e) {
    e.preventDefault();
    const table = document.querySelector("#propertyTable tbody");
    const newId = table.rows.length + 1;

    // Get all preview images as src
    const photoImages = Array.from(document.querySelectorAll("#photoPreviewContainer img")).map(img => img.src);
    const mapImages = Array.from(document.querySelectorAll("#mapPreviewContainer img")).map(img => img.src);

    // Create new table row
    const row = document.createElement("tr");
    row.innerHTML = `
        <td>${newId}</td>
        <td>${document.getElementById("title").value}</td>
        <td>${document.getElementById("author").value}</td>
        <td>${document.getElementById("category").value}</td>
        <td>${document.getElementById("description").value}</td>
        <td>${document.getElementById("place").value}</td>
        <td>${document.getElementById("filters").value}</td>
        <td>${new Date().toLocaleDateString()}</td>
        <td>
            <div class="photo-box">
                ${photoImages.map(src => `<img src="${src}" class="table-img" data-images='${JSON.stringify(photoImages)}'>`).join("")}
            </div>
        </td>
        <td>
            <div class="photo-box">
                ${mapImages.map(src => `<img src="${src}" class="table-img" data-images='${JSON.stringify(mapImages)}'>`).join("")}
            </div>
        </td>
    `;

    table.appendChild(row);

    // Close modal & reset
    addModal.style.display = "none";
    document.getElementById("propertyForm").reset();
    document.getElementById("photoPreviewContainer").innerHTML = "";
    document.getElementById("mapPreviewContainer").innerHTML = "";
    mainContent.style.filter = "none";

    alert(`Property #${newId} added successfully!`);
});


// ====================== IMAGE GALLERY ======================
let currentImages = [];
let currentIndex = 0;

const galleryImg = document.getElementById("galleryImg");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");




