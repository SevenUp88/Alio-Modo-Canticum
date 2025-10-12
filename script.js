document.addEventListener('DOMContentLoaded', () => {

    // ----------- DATI DEL CORO (DA PERSONALIZZARE) --------------
    // !!! IMPORTANTE: Controlla che i percorsi (es. "spartiti/...") e i nomi dei file siano ESATTI !!!

    const spartiti = [
        // Aggiungi qui gli spartiti. Esempio:
        { titolo: "ARCADELT - Ave Maria", file: "spartiti/ARCADELT_Ave Maria.pdf" },
        { titolo: "LOTTI - Stava Maria Dolente (SAT)", file: "spartiti/LOTTI_Stava Maria Dolente-SAT.pdf" },
        // Aggiungi qui gli altri spartiti...
    ];

    const audioStudio = [
        { 
            autore: "Lotti", 
            titolo: "Stava Maria Dolente",
            // Controlla la sottocartella, ad esempio: 'audio_studio/LOTTI/'
            voci: {
                soprano: "audio_studio/LOTTI/Stava Maria-S.mp3",
                contralto: "audio_studio/LOTTI/Stava Maria-A.mp3",
                tenore: "audio_studio/LOTTI/Stava Maria-T.mp3",
                basso: "audio_studio/LOTTI/Stava Maria-B.mp3"
            } 
        },
        // Aggiungi qui gli altri brani di studio...
    ];
    
    const concerti = [
        // Controlla la sottocartella, come da tuo screenshot: 'concerti/2025/Misa Tango/'
        { titolo: "Misa Tango - 1. Introitus et Kyrie", file: "concerti/2025/Misa Tango/1. Introitus et Kyrie ....mp3" },
        { titolo: "Misa Tango - 2. Gloria", file: "concerti/2025/Misa Tango/2. Gloria.mp3" },
        { titolo: "Misa Tango - 3. Credo", file: "concerti/2025/Misa Tango/3. Credo.mp3" },
        { titolo: "Misa Tango - 4. Sanctus", file: "concerti/2025/Misa Tango/4. Sanctus.mp3" },
        { titolo: "Misa Tango - 5. Benedictus", file: "concerti/2025/Misa Tango/5. Benedictus.mp3" },
        { titolo: "Misa Tango - 6. Agnus Dei", file: "concerti/2025/Misa Tango/6. Agnus Dei.mp3" },
        // Aggiungi qui le altre registrazioni di concerti...
    ];

    const foto = [
        // Esempio: { file: "foto/concerto1.jpg" },
        // Aggiungi qui i percorsi delle foto nella cartella 'foto/'
    ];
    // -------------------------------------------------------------------


    // --- Logica di Navigazione ---
    const navLinks = document.querySelectorAll('.nav-link');
    const pages = document.querySelectorAll('.page');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            pages.forEach(page => page.classList.remove('active'));
            document.getElementById(targetId).classList.add('active');
            navLinks.forEach(nav => nav.classList.remove('active'));
            link.classList.add('active');
        });
    });

    // --- Logica per il Visualizzatore PDF ---
    const pdfModal = document.getElementById('pdf-modal');
    const closeButtonPdf = document.querySelector('.close-button-pdf');
    const pdfViewerIframe = document.getElementById('pdf-viewer-iframe');
    const pdfTitle = document.getElementById('pdf-title');
    const pdfDownloadLink = document.getElementById('pdf-download-link');

    if (pdfModal) {
        closeButtonPdf.addEventListener('click', () => pdfModal.classList.remove('active'));
        pdfModal.addEventListener('click', (e) => {
            if(e.target === pdfModal) pdfModal.classList.remove('active');
        });
    }

    // --- Caricamento Spartiti ---
    const spartitiList = document.getElementById('spartiti-list');
    spartiti.forEach(spartito => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${spartito.titolo}</span>
            <div class="actions">
                <button class="view-pdf-button" data-title="${spartito.titolo}" data-file="${spartito.file}">Visualizza</button>
            </div>
        `;
        spartitiList.appendChild(li);
    });

    // Listener per i pulsanti "Visualizza"
    spartitiList.addEventListener('click', (e) => {
        if (e.target.classList.contains('view-pdf-button') && pdfModal) {
            const title = e.target.dataset.title;
            const file = e.target.dataset.file;
            
            pdfTitle.textContent = title;
            pdfDownloadLink.href = file; 
            pdfDownloadLink.setAttribute('download', file.split('/').pop()); 

            // Carica il visualizzatore PDF di Google (funziona solo online!)
            const onlineUrl = window.location.origin + window.location.pathname.replace('index.html', '') + file;
            pdfViewerIframe.src = `https://docs.google.com/viewer?url=${encodeURIComponent(onlineUrl)}&embedded=true`;
            
            pdfModal.classList.add('active');
        }
    });

    // --- Logica Studio Vocale ---
    const studioList = document.getElementById('studio-list');
    const searchBar = document.getElementById('search-bar');
    const audioPlayerStudio = new Audio(); 

    function renderStudioTracks(tracksToRender) {
        studioList.innerHTML = ''; 
        tracksToRender.forEach((brano, index) => {
            const trackDiv = document.createElement('div');
            trackDiv.className = 'studio-track';
            let buttonsHTML = '';
            if (brano.voci.soprano) buttonsHTML += `<button data-src="${brano.voci.soprano}">Soprano</button>`;
            if (brano.voci.contralto) buttonsHTML += `<button data-src="${brano.voci.contralto}">Contralto</button>`;
            if (brano.voci.tenore) buttonsHTML += `<button data-src="${brano.voci.tenore}">Tenore</button>`;
            if (brano.voci.basso) buttonsHTML += `<button data-src="${brano.voci.basso}">Basso</button>`;
            
            trackDiv.innerHTML = `<div class="studio-track-title">${brano.autore} - ${brano.titolo}</div><div class="studio-track-voices">${buttonsHTML}</div>`;
            studioList.appendChild(trackDiv);
        });
    }

    renderStudioTracks(audioStudio); 

    if (searchBar) {
        searchBar.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const filteredTracks = audioStudio.filter(brano => 
                brano.titolo.toLowerCase().includes(searchTerm) || 
                brano.autore.toLowerCase().includes(searchTerm)
            );
            renderStudioTracks(filteredTracks);
        });
    }

    let currentPlayingButton = null;
    studioList.addEventListener('click', function(e) {
        if (e.target.tagName === 'BUTTON') {
            const source = e.target.dataset.src;
            if (currentPlayingButton === e.target && !audioPlayerStudio.paused) {
                audioPlayerStudio.pause();
                currentPlayingButton.classList.remove('playing');
                currentPlayingButton = null;
            } else {
                audioPlayerStudio.src = source;
                audioPlayerStudio.play();
                if(currentPlayingButton) currentPlayingButton.classList.remove('playing');
                e.target.classList.add('playing');
                currentPlayingButton = e.target;
            }
        }
    });

    audioPlayerStudio.addEventListener('ended', () => {
        if(currentPlayingButton) currentPlayingButton.classList.remove('playing');
        currentPlayingButton = null;
    });

    // --- Logica Player per CONCERTI ---
    const playlistConcerti = document.getElementById('playlist-concerti');
    const audioConcerti = new Audio();
    let currentTrackConcerti = 0;
    
    // Elementi del player
    const playBtnConcerti = document.getElementById('play-btn-concerti');
    const prevBtnConcerti = document.getElementById('prev-btn-concerti');
    const nextBtnConcerti = document.getElementById('next-btn-concerti');
    const trackTitleConcerti = document.getElementById('track-title-concerti');
    const progressBarConcerti = document.getElementById('progress-bar-concerti');
    const progressContainerConcerti = document.getElementById('progress-container-concerti');
    const volumeSliderConcerti = document.getElementById('volume-slider-concerti'); // SLIDER VOLUME

    concerti.forEach((brano, index) => {
        const li = document.createElement('li');
        li.textContent = brano.titolo;
        li.dataset.index = index;
        playlistConcerti.appendChild(li);
    });

    function loadTrackConcerti(index) {
        const items = document.querySelectorAll('#playlist-concerti li');
        items.forEach(item => item.classList.remove('playing'));
        if (items.length > 0) items[index].classList.add('playing');
        
        currentTrackConcerti = index;
        trackTitleConcerti.textContent = concerti[index].titolo;
        audioConcerti.src = concerti[index].file;
    }
    
    function playTrackConcerti() { audioConcerti.play(); playBtnConcerti.innerHTML = '<i class="fas fa-pause"></i>'; }
    function pauseTrackConcerti() { audioConcerti.pause(); playBtnConcerti.innerHTML = '<i class="fas fa-play"></i>'; }

    if (playBtnConcerti) {
        playBtnConcerti.addEventListener('click', () => {
            // Controlla se è la prima riproduzione e carica il brano se non è ancora successo
            if (audioConcerti.src === '' && concerti.length > 0) {
                loadTrackConcerti(0);
            }
            if(audioConcerti.paused) playTrackConcerti(); else pauseTrackConcerti();
        });
    }
    
    // Listener per il volume
    if (volumeSliderConcerti) {
        volumeSliderConcerti.addEventListener('input', (e) => {
            audioConcerti.volume = e.target.value;
        });
        audioConcerti.volume = volumeSliderConcerti.value; // Imposta il volume iniziale
    }


    playlistConcerti.addEventListener('click', (e) => {
        if(e.target.tagName === 'LI') {
            loadTrackConcerti(parseInt(e.target.dataset.index));
            playTrackConcerti();
        }
    });
    
    if (nextBtnConcerti) {
        nextBtnConcerti.addEventListener('click', () => {
            currentTrackConcerti = (currentTrackConcerti + 1) % concerti.length;
            loadTrackConcerti(currentTrackConcerti);
            playTrackConcerti();
        });
    }

    if (prevBtnConcerti) {
        currentTrackConcerti = (currentTrackConcerti - 1 + concerti.length) % concerti.length;
        prevBtnConcerti.addEventListener('click', () => {
            loadTrackConcerti(currentTrackConcerti);
            playTrackConcerti();
        });
    }

    audioConcerti.addEventListener('timeupdate', (e) => {
        const { duration, currentTime } = e.srcElement;
        const progressPercent = (currentTime / duration) * 100;
        progressBarConcerti.style.width = `${progressPercent}%`;
    });
    
    progressContainerConcerti.addEventListener('click', (e) => {
        const width = progressContainerConcerti.clientWidth;
        audioConcerti.currentTime = (e.offsetX / width) * audioConcerti.duration;
    });

    if(concerti.length > 0) loadTrackConcerti(0);

    // --- Logica Galleria Foto ---
    const photoGrid = document.getElementById('photo-grid');
    const modal = document.getElementById('modal');
    const modalImg = document.getElementById('modal-img');
    const closeButton = document.querySelector('.close-button');
    foto.forEach(f => {
        const div = document.createElement('div');
        div.className = 'photo-item';
        div.innerHTML = `<img src="${f.file}" alt="Foto del coro">`;
        div.addEventListener('click', () => { modal.classList.add('active'); modalImg.src = f.file; });
        photoGrid.appendChild(div);
    });

    if (closeButton) {
        closeButton.addEventListener('click', () => modal.classList.remove('active'));
        modal.addEventListener('click', (e) => { if(e.target === modal) modal.classList.remove('active'); });
    }
});
