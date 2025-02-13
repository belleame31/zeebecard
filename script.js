// Import the functions you need from Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import { getFirestore, collection, getDocs, query, where, orderBy, deleteDoc, doc, addDoc } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-storage.js";

// Your Firebase config object
const firebaseConfig = {
    apiKey: "AIzaSyBjzwFpYLd5iqKqUOXne1zSibwN2XN1pqc",
    authDomain: "jebecard-9e48d.firebaseapp.com",
    projectId: "jebecard-9e48d",
    storageBucket: "jebecard-9e48d.firebasestorage.app",
    messagingSenderId: "986658878850",
    appId: "1:986658878850:web:a3d577d260068a00f74b9b",
    measurementId: "G-7RNPSLGCK0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

// Firebase authentication check
onAuthStateChanged(auth, (user) => {
    if (!user) {
        // If user is not authenticated, redirect to login page
        window.location.href = "login.html";
    }
});

// Store Firebase references for use in the rest of the app
window.db = db;
window.storage = storage;

// Firebase grid and other elements
const photocardGrid = document.getElementById('photocard-grid');
const searchInput = document.getElementById('search-input');
const filterMember = document.getElementById('filter-member');
const filterAlbum = document.getElementById('filter-album');
const sortBy = document.getElementById('sort-by');
const sortOrder = document.getElementById('sort-order');
const loadingSpinner = document.getElementById('loading-spinner');

// Function to fetch photocards from Firestore
async function fetchPhotocards(filters = {}, searchTerm = '', sort = 'recently-added', order = 'desc') {
    photocardGrid.innerHTML = ''; // Clear existing content

    // Show loading spinner before fetching data
    if (loadingSpinner) {
        loadingSpinner.style.display = 'block'; // Show spinner
    }

    try {
        let photocardQuery = collection(db, 'photocards');

        const filterQueries = [];
        if (filters.member) {
            filterQueries.push(where("member", "==", filters.member));
        }
        if (filters.album) {
            filterQueries.push(where("album", "==", filters.album));
        }

        if (filterQueries.length > 0) {
            photocardQuery = query(photocardQuery, ...filterQueries);
        }

        if (sort === 'recently-added') {
            photocardQuery = query(photocardQuery, orderBy("timestamp", order === 'asc' ? 'asc' : 'desc'));
        }

        const querySnapshot = await getDocs(photocardQuery);

        if (querySnapshot.empty) {
            const noResultsMessage = document.createElement('div');
            noResultsMessage.className = 'no-results';
            noResultsMessage.textContent = 'No photocards found matching the criteria.';
            photocardGrid.appendChild(noResultsMessage);
            return;
        }

        querySnapshot.forEach((docSnapshot) => {
            const photocard = docSnapshot.data();
            photocard.id = docSnapshot.id;

            if (
                photocard.member.toLowerCase().includes(searchTerm) ||
                photocard.album.toLowerCase().includes(searchTerm) ||
                photocard.event.toLowerCase().includes(searchTerm)
            ) {
                const photocardElement = createPhotocardElement(photocard);
                photocardGrid.appendChild(photocardElement);
            }
        });
    } catch (error) {
        console.error('Error fetching photocards: ', error);
    } finally {
        // Hide the loading spinner once fetching is complete
        if (loadingSpinner) {
            loadingSpinner.style.display = 'none'; // Hide spinner
        }
    }
}

// Function to create an HTML element for each photocard
function createPhotocardElement(photocard) {
    const card = document.createElement('div');
    card.classList.add('photocard');

    // Main content container (image, member, album, event)
    const contentContainer = document.createElement('div');
    contentContainer.classList.add('content-container');

    const imageContainer = document.createElement('div');
    imageContainer.classList.add('image-container');
    const image = document.createElement('img');
    image.src = photocard.imageUrl;  // Ensure this field exists in Firestore
    image.alt = photocard.member;
    imageContainer.appendChild(image);

    const member = document.createElement('div');
    member.classList.add('member');
    member.textContent = photocard.member;

    const album = document.createElement('div');
    album.classList.add('album');
    album.textContent = photocard.album;

    const event = document.createElement('div');
    event.classList.add('event');
    event.textContent = photocard.event;

    // Append the content to the content container
    contentContainer.appendChild(imageContainer);
    contentContainer.appendChild(member);
    contentContainer.appendChild(album);
    contentContainer.appendChild(event);

    // Create a container for the buttons
    const buttonContainer = document.createElement('div');
    buttonContainer.classList.add('button-container');

    // Create the favorite button
    const favoriteButton = document.createElement('button');
    favoriteButton.classList.add('heart-btn');
    favoriteButton.textContent = '❤️';
    favoriteButton.addEventListener('click', () => {
        favoriteButton.classList.toggle('favorited');
    });

    // Create the delete button
    const deleteButton = document.createElement('button');
    deleteButton.classList.add('delete-button');
    deleteButton.textContent = 'Delete';
    deleteButton.addEventListener('click', async () => {
        const confirmation = confirm('Are you sure you want to delete this photocard?');
        if (confirmation) {
            await deletePhotocard(photocard.id); // Call function to delete the photocard
        }
    });

    // Append buttons to the button container
    buttonContainer.appendChild(favoriteButton);
    buttonContainer.appendChild(deleteButton);

    // Append content container and button container to the photocard
    card.appendChild(contentContainer);
    card.appendChild(buttonContainer);

    return card;
}

// Function to delete a photocard from Firestore
async function deletePhotocard(id) {
    try {
        await deleteDoc(doc(db, 'photocards', id));
        fetchPhotocards();
    } catch (error) {
        console.error('Error deleting photocard: ', error);
    }
}

// Function to filter photocards based on search input
function filterPhotocards() {
    const filters = {
        member: filterMember.value || null,
        album: filterAlbum.value || null
    };

    const searchTerm = searchInput.value.trim().toLowerCase();
    const sort = sortBy.value;
    const order = sortOrder.value;

    fetchPhotocards(filters, searchTerm, sort, order);
}

// Function to add a new photocard
async function addPhotocard(event) {
    event.preventDefault(); // Prevent form submission

    // Get form values
    const imageUrl = document.getElementById('image-url').value;
    const member = document.getElementById('member').value;
    const album = document.getElementById('album').value;
    const eventName = document.getElementById('event').value;  // Change name to eventName for clarity

    try {
        // Add a new document to the photocards collection
        await addDoc(collection(db, 'photocards'), {
            imageUrl: imageUrl,
            member: member,
            album: album,
            event: eventName,  // Use eventName here instead of eventField
            timestamp: new Date()  // Add a timestamp for ordering
        });

        // Optionally, clear the form
        document.getElementById('photocard-form').reset();

        // Refresh the photocard grid after adding the new photocard
        fetchPhotocards();

    } catch (error) {
        console.error('Error adding photocard: ', error);
    }
}

// Initialize fetching photocards on page load
document.addEventListener('DOMContentLoaded', () => {
    fetchPhotocards();

    filterMember.addEventListener('change', filterPhotocards);
    filterAlbum.addEventListener('change', filterPhotocards);
    sortBy.addEventListener('change', filterPhotocards);
    sortOrder.addEventListener('change', filterPhotocards);

    searchInput.addEventListener('input', filterPhotocards);

    const photocardForm = document.getElementById('photocard-form');
    photocardForm.addEventListener('submit', addPhotocard);
});
