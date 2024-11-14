// recommendation.js
let recommendations = [];

document
  .getElementById("showRecommendation")
  .addEventListener("click", function () {
    document.getElementById("recommendationForm").style.display = "block";
    this.style.display = "none";
  });

document
  .getElementById("closeRecommendation")
  .addEventListener("click", function () {
    document.getElementById("recommendationForm").style.display = "none";
    document.getElementById("showRecommendation").style.display = "block";
    document.getElementById("recForm").reset();
  });

document.getElementById("recImage").addEventListener("change", function (e) {
  const statusElement = e.target.nextElementSibling;
  if (e.target.files && e.target.files[0]) {
    const fileSize = e.target.files[0].size / 1024 / 1024; // in MB
    if (fileSize > 5) {
      Swal.fire({
        icon: "error",
        title: "File terlalu besar",
        text: "Ukuran file maksimal 5MB",
      });
      e.target.value = "";
      statusElement.style.display = "none";
    } else {
      statusElement.style.display = "block";
    }
  } else {
    statusElement.style.display = "none";
  }
});

document
  .getElementById("recForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const name = document.getElementById("recName").value;
    const link = document.getElementById("recLink").value;
    const imageFile = document.getElementById("recImage").files[0];

    if (!name) {
      Swal.fire({
        icon: "error",
        title: "Data tidak lengkap",
        text: "Mohon isi nama peralatan",
      });
      return;
    }

    let imageData = null;
    if (imageFile) {
      imageData = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => resolve(event.target.result);
        reader.readAsDataURL(imageFile);
      });
    }

    const recommendation = {
      name,
      link,
      image: imageData,
    };

    recommendations.push(recommendation);
    updateRecommendationList();

    // Reset form
    document.getElementById("recForm").reset();
    document.getElementById("recommendationForm").style.display = "none";
    document.getElementById("showRecommendation").style.display = "block";

    Swal.fire({
      icon: "success",
      title: "Berhasil",
      text: "Rekomendasi telah ditambahkan",
    });
  });

function updateRecommendationList() {
  const container = document.getElementById("recommendationList");
  container.innerHTML = "";

  recommendations.forEach((rec, index) => {
    const item = document.createElement("div");
    item.className = "recommendation-item";
    item.innerHTML = `
      ${
        rec.image
          ? `<img src="${rec.image}" alt="${rec.name}" class="recommendation-image">`
          : ""
      }
      <div class="recommendation-name">${rec.name}</div>
      ${
        rec.link
          ? `<a href="${rec.link}" target="_blank" class="recommendation-link">${rec.link}</a>`
          : ""
      }
      <button type="button" class="btn btn-danger btn-sm mt-2" onclick="removeRecommendation(${index})">
        <i class="fas fa-trash"></i> Hapus
      </button>
    `;
    container.appendChild(item);
  });
}

function removeRecommendation(index) {
  Swal.fire({
    title: "Hapus rekomendasi?",
    text: "Data yang dihapus tidak dapat dikembalikan",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Ya, hapus!",
    cancelButtonText: "Batal",
  }).then((result) => {
    if (result.isConfirmed) {
      recommendations.splice(index, 1);
      updateRecommendationList();
      Swal.fire("Terhapus!", "Rekomendasi telah dihapus.", "success");
    }
  });
}

// Add this to your existing generatePDF function in script.js
async function addRecommendationsToPDF(doc) {
  if (recommendations.length > 0) {
    doc.addPage();
    await window.addBackgroundWithOpacity(doc);

    doc.setFontSize(14);
    doc.text("Rekomendasi Peralatan", 105, 15, null, null, "center");
    doc.setFontSize(10);

    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const marginBottom = 20;
    const marginTop = 30;
    const marginSide = 15;

    const gridWidth = (pageWidth - 2 * marginSide) / 2;
    const gridHeight = (pageHeight - marginTop - marginBottom) / 2;

    const maxImageWidth = gridWidth - 10;
    const maxImageHeight = (gridHeight - 40) / 1.5;

    let currentIndex = 0;

    while (currentIndex < recommendations.length) {
      if (currentIndex > 0 && currentIndex % 4 === 0) {
        doc.addPage();
        await window.addBackgroundWithOpacity(doc);
        doc.setFontSize(14);
        doc.text("Rekomendasi Peralatan", 105, 15, null, null, "center");
        doc.setFontSize(10);
      }

      const rowIndex = Math.floor((currentIndex % 4) / 2);
      const colIndex = currentIndex % 2;

      const xBase = marginSide + colIndex * gridWidth;
      const yBase = marginTop + rowIndex * gridHeight;

      const rec = recommendations[currentIndex];

      try {
        // Add name with bold style
        doc.setFont(undefined, "bold");
        doc.text(rec.name, xBase + 5, yBase + 10);
        doc.setFont(undefined, "normal");

        let yOffset = yBase + 20;

        // Add image if exists
        if (rec.image) {
          // Preload image to get dimensions
          await new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
              const aspectRatio = img.width / img.height;
              let finalWidth = maxImageWidth;
              let finalHeight = maxImageWidth / aspectRatio;

              if (finalHeight > maxImageHeight) {
                finalHeight = maxImageHeight;
                finalWidth = maxImageHeight * aspectRatio;
              }

              const xOffset = xBase + (gridWidth - finalWidth) / 2;

              doc.addImage(
                rec.image,
                "JPEG",
                xOffset,
                yOffset,
                finalWidth,
                finalHeight,
                undefined,
                "MEDIUM"
              );

              yOffset += finalHeight + 10;
              resolve();
            };
            img.onerror = reject;
            img.src = rec.image;
          });
        }

        // Add link if exists
        if (rec.link) {
          doc.setTextColor(0, 0, 255);
          const splitLink = doc.splitTextToSize(rec.link, gridWidth - 10);
          doc.text(splitLink, xBase + 5, yOffset);
          doc.setTextColor(0);
        }
      } catch (error) {
        console.error("Error processing recommendation:", error);
        doc.text(
          `Error menampilkan rekomendasi: ${rec.name}`,
          xBase + 5,
          yBase + 20
        );
      }

      currentIndex++;
    }
  }
}
