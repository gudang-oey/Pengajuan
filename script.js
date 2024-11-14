let formCounter = 1;

// Format currency function
function formatCurrency(number) {
  if (isNaN(number)) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .format(number)
    .replace(/\s/g, " ");
}

// Parse currency string to number
function parseCurrency(currencyString) {
  if (!currencyString) return 0;
  return parseInt(currencyString.replace(/[^\d]/g, "")) || 0;
}

// Validate images
const validateImages = async () => {
  const imageInputs = document.querySelectorAll('input[name="image[]"]');
  for (let input of imageInputs) {
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (!file.type.startsWith("image/")) {
        throw new Error("Invalid file type. Only images are allowed.");
      }
      if (file.size > 5 * 1024 * 1024) {
        throw new Error("Image size too large. Maximum size is 5MB.");
      }
    }
  }
};

document.getElementById("addRow").addEventListener("click", function () {
  var tbody = document.querySelector("#equipmentTable tbody");
  var newRow = tbody.rows[0].cloneNode(true);
  var inputs = newRow.getElementsByTagName("input");
  for (var i = 0; i < inputs.length; i++) {
    inputs[i].value = "";
  }
  newRow.querySelector('select[name="unit[]"]').selectedIndex = 0;
  newRow.querySelector(".upload-status").style.display = "none";
  tbody.appendChild(newRow);
});

// Handle file upload status
document.addEventListener("change", function (e) {
  if (e.target.classList.contains("image-upload")) {
    const statusElement = e.target.nextElementSibling;
    if (e.target.files && e.target.files[0]) {
      const fileSize = e.target.files[0].size / 1024 / 1024;
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
  }
});

function removeRow(button) {
  var row = button.closest("tr");
  if (document.querySelectorAll("#equipmentTable tbody tr").length > 1) {
    row.remove();
  } else {
    Swal.fire({
      icon: "warning",
      title: "Tidak dapat menghapus",
      text: "Minimal harus ada satu baris data",
    });
  }
}

// Handle price and quantity inputs
document
  .getElementById("equipmentTable")
  .addEventListener("input", function (e) {
    if (e.target.classList.contains("price-input")) {
      const value = parseCurrency(e.target.value);
      e.target.value = formatCurrency(value);
      calculateTotal(e.target.closest("tr"));
    } else if (e.target.classList.contains("quantity-input")) {
      calculateTotal(e.target.closest("tr"));
    }
  });

function calculateTotal(row) {
  const quantity = parseInt(row.querySelector(".quantity-input").value) || 0;
  const price = parseCurrency(row.querySelector(".price-input").value);
  const total = quantity * price;
  row.querySelector(".total-input").value = formatCurrency(total);
}
document
  .getElementById("generatePDF")
  .addEventListener("click", async function () {
    // Validate form
    const name = document.getElementById("name").value;
    const outlet = document.getElementById("outlet").value;

    if (!name || !outlet) {
      Swal.fire({
        icon: "error",
        title: "Data tidak lengkap",
        text: "Mohon lengkapi Nama Pemohon dan Cabang Outlet",
      });
      return;
    }

    // Validate images
    try {
      await validateImages();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message,
      });
      return;
    }

    // Show loading
    Swal.fire({
      title: "Generating PDF",
      html: "Mohon tunggu sebentar...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();

      // Fungsi untuk menambahkan background
      const addBackgroundWithOpacity = async () => {
        try {
          const backgroundImage = await new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => resolve(null);
            img.src = "background.png";
          });

          if (backgroundImage) {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            canvas.width = backgroundImage.width;
            canvas.height = backgroundImage.height;
            ctx.globalAlpha = 1.0;
            ctx.drawImage(backgroundImage, 0, 0);
            const transparentImageData = canvas.toDataURL("image/png");

            const pageWidth = doc.internal.pageSize.width;
            const logoSize = 20;
            const xPos = pageWidth - logoSize - 14;
            const yPos = 8;

            doc.addImage(
              transparentImageData,
              "PNG",
              xPos,
              yPos,
              logoSize,
              logoSize,
              "",
              "none",
              0
            );
          }
        } catch (error) {
          console.error("Error adding background:", error);
        }
      };
      window.addBackgroundWithOpacity = async function (doc) {
        try {
          const backgroundImage = await new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => resolve(null);
            img.src = "background.png";
          });

          if (backgroundImage) {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            canvas.width = backgroundImage.width;
            canvas.height = backgroundImage.height;
            ctx.globalAlpha = 1.0;
            ctx.drawImage(backgroundImage, 0, 0);
            const transparentImageData = canvas.toDataURL("image/png");

            const pageWidth = doc.internal.pageSize.width;
            const logoSize = 20;
            const xPos = pageWidth - logoSize - 14;
            const yPos = 8;

            doc.addImage(
              transparentImageData,
              "PNG",
              xPos,
              yPos,
              logoSize,
              logoSize,
              "",
              "none",
              0
            );
          }
        } catch (error) {
          console.error("Error adding background:", error);
        }
      };
      await addBackgroundWithOpacity();

      // Header
      doc.setFontSize(16);
      doc.text("FORM PENGAJUAN PERALATAN", 105, 20, null, null, "center");
      doc.setFontSize(10);

      // Form details
      const currentDate = new Date().toLocaleDateString("id-ID", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
      const idPengajuan = `Kopi Oey_${outlet}`;
      const labelWidth = 30;

      doc.text(`ID Pengajuan`, 14, 35);
      doc.text(`:`, 14 + labelWidth, 35);
      doc.text(`${idPengajuan}`, 14 + labelWidth + 2, 35);

      doc.text(`Nama Pemohon`, 14, 40);
      doc.text(`:`, 14 + labelWidth, 40);
      doc.text(`${name}`, 14 + labelWidth + 2, 40);

      doc.text(`Cabang Outlet`, 14, 45);
      doc.text(`:`, 14 + labelWidth, 45);
      doc.text(`${outlet}`, 14 + labelWidth + 2, 45);

      doc.text(`Tanggal`, 14, 50);
      doc.text(`:`, 14 + labelWidth, 50);
      doc.text(`${currentDate}`, 14 + labelWidth + 2, 50);

      // Table data
      const headers = [
        [
          "No",
          "Nama Peralatan",
          "QTY",
          "Satuan",
          "Harga Estimasi",
          "Total",
          "Tgl Last Order",
          "Keterangan",
        ],
      ];
      const data = [];
      let totalEstimasi = 0;
      const images = [];

      // Collect table data and images
      const rows = document.querySelectorAll("#equipmentTable tbody tr");
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const name = row.querySelector('input[name="equipmentName[]"]').value;
        const quantity = row.querySelector('input[name="quantity[]"]').value;
        const unit = row.querySelector('select[name="unit[]"]').value;
        const price = parseCurrency(
          row.querySelector('input[name="price[]"]').value
        );
        const total = parseCurrency(
          row.querySelector('input[name="total[]"]').value
        );
        const date = row.querySelector(
          'input[name="lastPurchaseDate[]"]'
        ).value;
        const keterangan = row.querySelector(
          'input[name="keterangan[]"]'
        ).value;
        const imageInput = row.querySelector('input[name="image[]"]');

        if (name && quantity) {
          data.push([
            i + 1,
            name,
            quantity,
            unit,
            formatCurrency(price),
            formatCurrency(total),
            date,
            keterangan,
          ]);

          totalEstimasi += total;

          if (imageInput && imageInput.files && imageInput.files[0]) {
            try {
              const imageData = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.onerror = (e) =>
                  reject(new Error("Failed to read file"));
                reader.readAsDataURL(imageInput.files[0]);
              });

              images.push({
                name: name,
                data: imageData,
              });
            } catch (error) {
              console.error(`Error reading image for ${name}:`, error);
              Swal.fire({
                icon: "error",
                title: "Error",
                text: `Gagal memuat gambar untuk ${name}`,
              });
            }
          }
        }
      }

      // Add table to document
      doc.autoTable({
        head: headers,
        body: data,
        startY: 55,
        theme: "grid",
        styles: { fontSize: 8, cellPadding: 2, halign: "center" },
        columnStyles: {
          0: { cellWidth: 10 },
          1: { cellWidth: 40 },
          7: { cellWidth: 30 },
        },
        didDrawPage: function (data) {
          doc.setFontSize(8);
          doc.text(
            `Page ${data.pageNumber}`,
            data.settings.margin.left,
            doc.internal.pageSize.height - 10
          );
        },
      });

      const finalY = doc.lastAutoTable.finalY || 55;
      let currentY = finalY + 10;

      // Add description and total
      const description =
        "Berikut pengajuan peralatan outlet kami, agar tidak menimbulkan kendala di operasional, mohon disetujui agar segera diproses oleh tim gudang, terima kasih.";
      doc.setFontSize(10);
      const splitDesc = doc.splitTextToSize(description, 180);
      doc.text(splitDesc, 14, currentY);
      currentY += splitDesc.length * 7 + 10;

      // Add total estimation
      const totalEstimasiText = `Total Estimasi: ${formatCurrency(
        totalEstimasi
      )}`;
      const textWidth =
        (doc.getStringUnitWidth(totalEstimasiText) *
          doc.internal.getFontSize()) /
        doc.internal.scaleFactor;
      const boxWidth = textWidth + 10;
      const boxHeight = 8;
      const pageWidth = doc.internal.pageSize.width;
      const boxX = (pageWidth - boxWidth) / 2;

      doc.setFillColor(255, 255, 0);
      doc.rect(boxX, currentY, boxWidth, boxHeight, "F");
      doc.setDrawColor(0);
      doc.rect(boxX, currentY, boxWidth, boxHeight, "S");
      doc.setFont(undefined, "bold");
      doc.setTextColor(0);
      doc.text(
        totalEstimasiText,
        pageWidth / 2,
        currentY + 5.5,
        null,
        null,
        "center"
      );
      doc.setFont(undefined, "normal");

      currentY += boxHeight + 60;

      // Add signatures
      const signatureStartY = currentY;
      const signatureSpacing = 35;

      // First row signatures
      doc.text(
        "_________________",
        pageWidth / 4,
        signatureStartY,
        null,
        null,
        "center"
      );
      doc.text(
        "Pemohon",
        pageWidth / 4,
        signatureStartY + 5,
        null,
        null,
        "center"
      );

      doc.text(
        "_________________",
        (pageWidth * 3) / 4,
        signatureStartY,
        null,
        null,
        "center"
      );
      doc.text(
        "R&D",
        (pageWidth * 3) / 4,
        signatureStartY + 5,
        null,
        null,
        "center"
      );

      // Second row signatures
      doc.text(
        "_________________",
        pageWidth / 4,
        signatureStartY + signatureSpacing,
        null,
        null,
        "center"
      );
      doc.text(
        "HOD",
        pageWidth / 4,
        signatureStartY + signatureSpacing + 5,
        null,
        null,
        "center"
      );

      doc.text(
        "_________________",
        (pageWidth * 3) / 4,
        signatureStartY + signatureSpacing,
        null,
        null,
        "center"
      );
      doc.text(
        "Finance",
        (pageWidth * 3) / 4,
        signatureStartY + signatureSpacing + 5,
        null,
        null,
        "center"
      );

      // Add images
      if (images.length > 0) {
        doc.addPage();
        await addBackgroundWithOpacity();

        doc.setFontSize(14);
        doc.text("Lampiran Gambar", 105, 15, null, null, "center");
        doc.setFontSize(10);

        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;
        const marginBottom = 20;
        const marginTop = 30;
        const marginSide = 15;

        // Konfigurasi grid untuk 4 gambar
        const gridWidth = (pageWidth - 2 * marginSide) / 2; // Lebar untuk 2 kolom
        const gridHeight = (pageHeight - marginTop - marginBottom) / 2; // Tinggi untuk 2 baris

        // Ukuran maksimum untuk setiap gambar
        const maxImageWidth = gridWidth - 10; // Margin horizontal 5px per sisi
        const maxImageHeight = (gridHeight - 20) / 1.2; // Margin vertikal + ruang untuk label

        let currentImageIndex = 0;
        let currentPage = 1;

        while (currentImageIndex < images.length) {
          if (currentImageIndex > 0 && currentImageIndex % 4 === 0) {
            doc.addPage();
            await addBackgroundWithOpacity();
            doc.setFontSize(14);
            doc.text("Lampiran Gambar", 105, 15, null, null, "center");
            doc.setFontSize(10);
            currentPage++;
          }

          const rowIndex = Math.floor((currentImageIndex % 4) / 2);
          const colIndex = currentImageIndex % 2;

          const xBase = marginSide + colIndex * gridWidth;
          const yBase = marginTop + rowIndex * gridHeight;

          const imageInfo = images[currentImageIndex];

          try {
            // Load image
            const img = await new Promise((resolve, reject) => {
              const image = new Image();
              image.onload = () => resolve(image);
              image.onerror = reject;
              image.src = imageInfo.data;
            });

            // Calculate aspect ratio and final dimensions
            const aspectRatio = img.width / img.height;
            let finalWidth = maxImageWidth;
            let finalHeight = maxImageWidth / aspectRatio;

            if (finalHeight > maxImageHeight) {
              finalHeight = maxImageHeight;
              finalWidth = maxImageHeight * aspectRatio;
            }

            // Center image in its grid cell
            const xOffset = xBase + (gridWidth - finalWidth) / 2;
            const yOffset = yBase + 15; // Space for label

            // Add label
            doc.setFontSize(10);
            doc.text(`${imageInfo.name}:`, xBase + 5, yBase + 10);

            // Add image
            doc.addImage(
              imageInfo.data,
              "JPEG",
              xOffset,
              yOffset,
              finalWidth,
              finalHeight,
              undefined,
              "MEDIUM"
            );
          } catch (error) {
            console.error("Error processing image:", error);
            doc.text(
              `Gagal memuat gambar ${imageInfo.name}`,
              xBase + 5,
              yBase + 20
            );
          }

          currentImageIndex++;
        }
      }
      await addRecommendationsToPDF(doc);
      // Save PDF
      const filename = `form_pengajuan_kopi_oey_${outlet.toLowerCase()}.pdf`;
      doc.save(filename);

      // Show success message
      Swal.fire({
        icon: "success",
        title: "PDF berhasil dibuat",
        text: `File telah disimpan dengan nama ${filename}`,
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      Swal.fire({
        icon: "error",
        title: "Terjadi kesalahan",
        text: "Gagal membuat PDF. Silakan coba lagi.",
      });
    }
  });

// Event listeners for form interaction
document.getElementById("refreshForm").addEventListener("click", function () {
  Swal.fire({
    title: "Refresh form?",
    text: "Semua data yang telah diisi akan dihapus",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Ya, hapus!",
    cancelButtonText: "Batal",
  }).then((result) => {
    if (result.isConfirmed) {
      document.getElementById("equipmentForm").reset();
      const tbody = document.querySelector("#equipmentTable tbody");
      while (tbody.children.length > 1) {
        tbody.removeChild(tbody.lastChild);
      }
      const uploadStatuses = document.querySelectorAll(".upload-status");
      uploadStatuses.forEach((status) => (status.style.display = "none"));

      Swal.fire("Berhasil!", "Form telah direset.", "success");
    }
  });
});
