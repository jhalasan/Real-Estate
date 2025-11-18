import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(
  'https://osywaesdozykwhupydzy.supabase.co',
  'YOUR_PUBLIC_ANON_KEY'
);


const CURRENT_AGENT = "Frank D. Sinatra";

async function loadReports() {
    const tableBody = document.querySelector(".report-table tbody");
    tableBody.innerHTML = "";

    const { data: inquiries, error } = await supabase
        .from("inquiries")
        .select("*")
        .order("id", { ascending: false });

    if (error) {
        console.error(error);
        return;
    }

    inquiries.forEach(item => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${item.property_name}</td>
            <td><img src="property-images/${item.property_id}.jpg" class="property-photo"></td>
            <td>${item.accepted_by ? item.accepted_by : "Pending"}</td>
            <td>${item.name}</td>
            <td>${item.phone}</td>
            <td>${item.message}</td>

            <td class="confirm-col">
                <button class="btn-remove" data-id="${item.id}">✖</button>
                <button class="btn-accept" data-id="${item.id}">✔</button>
            </td>
        `;

        tableBody.appendChild(row);
    });

    attachButtonEvents();
}


// BUTTON ACTIONS


function attachButtonEvents() {
    document.querySelectorAll(".btn-accept").forEach(btn => {
        btn.addEventListener("click", () => acceptInquiry(btn.dataset.id));
    });

    document.querySelectorAll(".btn-remove").forEach(btn => {
        btn.addEventListener("click", () => removeInquiry(btn.dataset.id));
    });
}


// ACCEPT INQUIRY


async function acceptInquiry(id) {

    const { error } = await supabase
        .from("inquiries")
        .update({
            status: "accepted",
            accepted_by: CURRENT_AGENT
        })
        .eq("id", id);

    if (error) {
        alert("Error accepting inquiry!");
        return;
    }

    alert("Accepted!");
    loadReports();
}


// REMOVE INQUIRY


async function removeInquiry(id) {

    const confirmDelete = confirm("Are you sure you want to remove this inquiry?");
    if (!confirmDelete) return;

    const { error } = await supabase
        .from("inquiries")
        .update({
            status: "removed"
        })
        .eq("id", id);

    if (error) {
        alert("Error removing inquiry!");
        return;
    }

    alert("Removed!");
    loadReports();
}


document.addEventListener("DOMContentLoaded", loadReports);
