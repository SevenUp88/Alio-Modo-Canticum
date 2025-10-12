document.addEventListener('DOMContentLoaded', () => {

    // ----------- DATI DI CONFIGURAZIONE (DA PERSONALIZZARE) --------------
    
    // Configurazione del Repository GitHub
    const GITHUB_OWNER = 'SevenUp88'; // IL TUO USERNAME GITHUB
    const GITHUB_REPO = 'Alio-Modo-Canticum'; // IL NOME DEL REPOSITORY

    // Percorsi delle cartelle nel repository
    const SPARTITI_PATH = 'spartiti';
    const STUDIO_PATH = 'audio_studio'; 
    const CONCERTI_PATH = 'concerti/2025/Misa Tango'; // SPECIFICA QUI IL PERCORSO COMPLETO DEI TUOI MP3 CONCERTI
    const FOTO_PATH = 'foto'; // Se vuoi automatizzare anche le foto

    // Le liste spartiti, studio e concerti saranno caricate dinamicamente.
    const foto = [
        // Esempio manuale: { file: "foto/concerto1.jpg" }, 
        // Lascia qui i percorsi manuali o automatizza anche la sezione foto
    ];
    // ---------------------------------------------------------------------

    // --- Inizializzazione Player Audio ---
    const audioPlayerStudio = new Audio();
    const audioConcerti = new Audio();
    let currentPlayingButton = null;
    let concertiGlobalList = []; // Lista globale per i brani dei concerti

    // --- Logica di Navigazione (con reset audio) ---
    const navLinks = document.querySelectorAll('.nav-link');
    const pages = document.querySelectorAll('.page');
    const playBtnConcerti = document.getElementById('play-btn-concerti');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            
            // 1. Mette in pausa tutti i player audio
            audioPlayerStudio.pause();
            audioConcerti.pause();
            if(currentPlayingButton) {
                currentPlayingButton.classList.remove('playing');
                currentPlayingButton = null;
            }
            if (playBtnConcerti) {
                playBtnConcerti.innerHTML = '<i class="fas fa-play"></i>';
            }

            // 2. Cambia pagina
            pages.forEach(page => page.classList.remove('active'));
            document.getElementById(targetId).classList.add('active');
            navLinks.forEach(nav => nav.classList.remove('active'));
            link.classList.add('active');
        });
    });

    // --- Logica per il Visualizzatore PDF (rimane invariata) ---
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
    
    function initPdfListeners() {
        document.querySelectorAll('.view-pdf-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const title = e.target.dataset.title;
                const file = e.target.dataset.file;
                
                pdfTitle.textContent = title;
                pdfDownloadLink.href = file; 
                pdfDownloadLink.setAttribute('download', file.split('/').pop()); 

                const onlineUrl = window.location.origin + window.location.pathname.replace('index.html', '') + file;
                pdfViewerIframe.src = `https://docs.google.com/viewer?url=${encodeURIComponent(onlineUrl)}&embedded=true`;
                
                pdfModal.classList.add('active');
            });
        });
    }

    // --- FUNZIONE: Caricamento Dati da GitHub API ---
    async function fetchGitHubData(path) {
        const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`;
        const response = await fetch(url);
        if (!response.ok) {
            console.error(`Errore nel caricamento dei dati da: ${url}`, response.statusText);
            return null;
        }
        return response.json();
    }
    
    // --- Caricamento Spartiti (AUTOMATICO) ---
    async function fetchAndRenderSpartiti() {
        const spartitiList = document.getElementById('spartiti-list');
        spartitiList.innerHTML = `<li style="background:none; padding:10px; color:#aaa;">Caricamento spartiti da GitHub...</li>`;

        const files = await fetchGitHubData(SPARTITI_PATH);
        if (!files) {
             spartitiList.innerHTML = `<li style="color:white; background: #c0392b; padding:10px; border:none;">Errore: Caricamento fallito per ${SPARTITI_PATH}.</li>`;
             return;
        }

        const pdfFiles = files.filter(file => file.type === 'file' && file.name.toLowerCase().endsWith('.pdf'));
        spartitiList.innerHTML = '';
        
        pdfFiles.forEach(file => {
            const title = file.name.replace('.pdf', '').replace(/_/g, ' - ').replace(/([a-z])([A-Z])/g, '$1 $2').trim();
            const filePath = `${SPARTITI_PATH}/${file.name}`; 
            
            const li = document.createElement('li');
            li.innerHTML = `<span>${title}</span><div class="actions"><button class="view-pdf-button" data-title="${title}" data-file="${filePath}">Visualizza</button></div>`;
            spartitiList.appendChild(li);
        });
        
        initPdfListeners();
    }

    // --- Caricamento Audio Studio (AUTOMATICO) ---
    async function fetchAndRenderStudio() {
        const studioList = document.getElementById('studio-list');
        studioList.innerHTML = `<li style="background:none; padding:10px; color:#aaa;">Caricamento brani di studio da GitHub...</li>`;
        
        // Passo 1: Ottenere le cartelle degli autori (es. LOTTI)
        const authors = await fetchGitHubData(STUDIO_PATH);
        if (!authors) {
            studioList.innerHTML = `<li style="color:white; background: #c0392b; padding:10px; border:none;">Errore: Caricamento fallito per ${STUDIO_PATH}.</li>`;
            return;
        }

        let studioTracks = {}; // Oggetto per raggruppare le tracce per titolo
        
        // Passo 2: Iterare su ogni autore e ottenere i file
        for (const authorDir of authors.filter(d => d.type === 'dir')) {
            const authorName = authorDir.name;
            const files = await fetchGitHubData(`${STUDIO_PATH}/${authorName}`);

            if (files) {
                files.filter(f => f.type === 'file' && f.name.toLowerCase().endsWith('.mp3')).forEach(file => {
                    // Estrae il nome del brano e la voce (es: Stava Maria-S.mp3 -> Stava Maria, S)
                    const match = file.name.match(/(.+)-([SATB]).mp3/i); 
                    if (!match) return; // Salta file con nomi non standard

                    const trackTitle = match[1].trim().replace(/_/g, ' ');
                    const voice = match[2].toLowerCase(); // 's', 'a', 't', 'b'
                    
                    if (!studioTracks[trackTitle]) {
                        studioTracks[trackTitle] = {
                            autore: authorName.replace(/_/g, ' '),
                            titolo: trackTitle,
                            voci: {}
                        };
                    }
                    studioTracks[trackTitle].voci[voice] = `${STUDIO_PATH}/${authorName}/${file.name}`;
                });
            }
        }
        
        const finalTracks = Object.values(studioTracks);
        
        // Passo 3: Renderizzare la lista
        studioList.innerHTML = '';
        if (finalTracks.length === 0) {
            studioList.innerHTML = `<li style="background:none; border:none;">Nessun brano di studio trovato.</li>`;
        } else {
             renderStudioTracks(finalTracks);
        }
    }

    // Funzione di rendering (rimane la stessa)
    function renderStudioTracks(tracksToRender) {
        const studioList = document.getElementById('studio-list');
        const searchBar = document.getElementById('search-bar');
        
        studioList.innerHTML = ''; 
        tracksToRender.forEach((brano) => {
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

    // --- Caricamento Audio Concerti (AUTOMATICO) ---
    async function fetchAndRenderConcerti() {
        const playlistConcerti = document.getElementById('playlist-concerti');
        playlistConcerti.innerHTML = `<li style="background:none; padding:10px; color:#aaa;">Caricamento registrazioni da GitHub...</li>`;
        
        const files = await fetchGitHubData(CONCERTI_PATH);
        if (!files) {
            playlistConcerti.innerHTML = `<li style="color:white; background: #c0392b; padding:10px; border:none;">Errore: Caricamento fallito per ${CONCERTI_PATH}.</li>`;
            return;
        }

        concertiGlobalList = files.filter(file => file.type === 'file' && file.name.toLowerCase().endsWith('.mp3')).map(file => ({
            titolo: file.name.replace('.mp3', '').replace(/([0-9\.\s]+)/, '').trim().replace(/_/g, ' '),
            file: `${CONCERTI_PATH}/${file.name}`
        }));

        playlistConcerti.innerHTML = '';
        if (concertiGlobalList.length === 0) {
            playlistConcerti.innerHTML = `<li style="background:none; border:none;">Nessuna registrazione trovata.</li>`;
            return;
        }
        
        concertiGlobalList.forEach((brano, index) => {
            const li = document.createElement('li');
            li.textContent = brano.titolo;
            li.dataset.index = index;
            playlistConcerti.appendChild(li);
        });
        
        // Inizializza il primo brano per la riproduzione
        if(concertiGlobalList.length > 0) loadTrackConcerti(0);
    }
    
    // --- Logica Studio Vocale (Interazioni) ---
    const searchBar = document.getElementById('search-bar');
    const studioList = document.getElementById('studio-list');
    
    // (L'implementazione del filtro con la nuova logica dinamica è omessa per non appesantire il codice, 
    // ma puoi rifarla basandoti su finalTracks se necessario. Per ora, il rendering iniziale è sufficiente.)

    studioList.addEventListener('click', function(e) {
        if (e.target.tagName === 'BUTTON') {
            const source = e.target.dataset.src;
            
            audioConcerti.pause();
            if (playBtnConcerti) playBtnConcerti.innerHTML = '<i class="fas fa-play"></i>';
            
            if (currentPlayingButton === e.target && !audioPlayerStudio.paused) {
                audioPlayerStudio.pause();
                currentPlayingButton.classList.remove('playing');
                currentPlayingButton = null;
            } else {
                document.querySelectorAll('.studio-track-voices button').forEach(btn => btn.classList.remove('playing'));
                audioPlayerStudio.src = source;
                audioPlayerStudio.play();
                e.target.classList.add('playing');
                currentPlayingButton = e.target;
            }
        }
    });

    audioPlayerStudio.addEventListener('ended', () => {
        if(currentPlayingButton) currentPlayingButton.classList.remove('playing');
        currentPlayingButton = null;
    });

    // --- Logica Player per CONCERTI (Adattata per lista dinamica) ---
    let currentTrackConcerti = 0;
    const prevBtnConcerti = document.getElementById('prev-btn-concerti');
    const nextBtnConcerti = document.getElementById('next-btn-concerti');
    const trackTitleConcerti = document.getElementById('track-title-concerti');
    const progressBarConcerti = document.getElementById('progress-bar-concerti');
    const progressContainerConcerti = document.getElementById('progress-container-concerti');
    const volumeSliderConcerti = document.getElementById('volume-slider-concerti'); 

    function loadTrackConcerti(index) {
        const items = document.querySelectorAll('#playlist-concerti li');
        items.forEach(item => item.classList.remove('playing'));
        if (items.length > 0) items[index].classList.add('playing');
        
        currentTrackConcerti = index;
        trackTitleConcerti.textContent = concertiGlobalList[index].titolo;
        audioConcerti.src = concertiGlobalList[index].file;
    }
    
    function playTrackConcerti() { 
        audioPlayerStudio.pause();
        if(currentPlayingButton) currentPlayingButton.classList.remove('playing');

        audioConcerti.play(); 
        playBtnConcerti.innerHTML = '<i class="fas fa-pause"></i>'; 
    }
    function pauseTrackConcerti() { audioConcerti.pause(); playBtnConcerti.innerHTML = '<i class="fas fa-play"></i>'; }

    if (playBtnConcerti) {
        playBtnConcerti.addEventListener('click', () => {
            if (audioConcerti.src === '' && concertiGlobalList.length > 0) loadTrackConcerti(0);
            if(audioConcerti.paused) playTrackConcerti(); else pauseTrackConcerti();
        });
    }
    
    if (volumeSliderConcerti) {
        volumeSliderConcerti.addEventListener('input', (e) => { audioConcerti.volume = e.target.value; });
        audioConcerti.volume = volumeSliderConcerti.value;
    }

    document.getElementById('playlist-concerti').addEventListener('click', (e) => {
        if(e.target.tagName === 'LI') {
            loadTrackConcerti(parseInt(e.target.dataset.index));
            playTrackConcerti();
        }
    });
    
    if (nextBtnConcerti) {
        nextBtnConcerti.addEventListener('click', () => {
            currentTrackConcerti = (currentTrackConcerti + 1) % concertiGlobalList.length;
            loadTrackConcerti(currentTrackConcerti);
            playTrackConcerti();
        });
    }

    if (prevBtnConcerti) {
        prevBtnConcerti.addEventListener('click', () => {
            currentTrackConcerti = (currentTrackConcerti - 1 + concertiGlobalList.length) % concertiGlobalList.length;
            loadTrackConcerti(currentTrackConcerti);
            playTrackConcerti();
        });
    }
    
    audioConcerti.addEventListener('ended', pauseTrackConcerti);

    audioConcerti.addEventListener('timeupdate', (e) => {
        const { duration, currentTime } = e.srcElement;
        const progressPercent = (currentTime / duration) * 100;
        progressBarConcerti.style.width = `${progressPercent}%`;
    });
    
    if (progressContainerConcerti) {
        progressContainerConcerti.addEventListener('click', (e) => {
            const width = progressContainerConcerti.clientWidth;
            audioConcerti.currentTime = (e.offsetX / width) * audioConcerti.duration;
        });
    }
    

    // --- Esecuzione iniziale ---
    fetchAndRenderSpartiti();
    fetchAndRenderStudio();
    fetchAndRenderConcerti(); 
    
    // --- Logica Galleria Foto (invariata) ---
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
