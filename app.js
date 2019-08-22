let movieDB = [];
let modals = '';

loadSearchAndImportListeners();
getStoredMovies();

function loadSearchAndImportListeners() {
  document.getElementById("search-box").addEventListener("keyup", function(event) {
    event.preventDefault();
    if (event.keyCode === 13) {
        document.getElementById("search").click();
    }
  });
  document.getElementById('search').addEventListener('click', function() {
    getMovieInfo(document.getElementById('search-box').value);
  });
  document.getElementById('clear-search').addEventListener('click', function() {
    document.getElementById('output').innerHTML = '';
    document.getElementById('search-box').value = '';
  });

  document.querySelector(".file").addEventListener('change', function() {
    readDatabaseFile();
  });

  document.getElementById('filter').addEventListener('keyup', function() {
    event.preventDefault();
      filterMovies();
  });
  document.getElementById('filter-clear').addEventListener('click', function() {
    document.getElementById('filter').value = '';
    updateTableDisplay(movieDB);
  });
}

// Retrieve movies from Local Storage
function getStoredMovies() {
  if(JSON.parse(localStorage.getItem('movies')) != null){
    movieDB = JSON.parse(localStorage.getItem('movies'));
  }
  updateTableDisplay(movieDB);
}

// Determine if there are movies and update display
function updateTableDisplay(movies){
  if(movies.length > 0){
    populateMovieTable(movies);
  } else if (movieDB.length > 0){
    document.getElementById("alert-container").innerHTML = `
    <div class="alert alert-danger" role="alert">
      No movies match that filter.
    </div>`;
    document.querySelector('.table-body').innerHTML = '';
    document.getElementById('totalMovies').textContent = '0 movies';
  } else {
    // Alert database is empty
    document.getElementById("alert-container").innerHTML = `
    <div class="alert alert-danger" role="alert">
      You have no movies in your database. Search for movies to add.
    </div>`;
    // Clear out unusable displays
    document.querySelector('.table-body').innerHTML = '';
    document.getElementById("empty-btn").innerHTML = '';
    document.getElementById("export").style.display = 'none';
    document.getElementById('totalMovies').textContent = '';
  }
}

// Fill movie table with movies
function populateMovieTable(movies) {
  loadButtonListeners();
  document.getElementById("alert-container").innerHTML = ``;
  let movieRows = '';
  movies.forEach(movie => {
    movieRows += drawTableRows(movies, movie);
  });

  // Update movie counter
  const totalMovies = movies.length + ' movie' + (movies.length === 1 ? '' : 's');
  document.getElementById('totalMovies').textContent = totalMovies;
  
  // Insert movie table into the DOM
  document.querySelector('.table-body').innerHTML = movieRows;

  // Create Edit movie modals
  enableEditDelete(movies);
  // Insert Edit movie modals into the DOM
  document.getElementById('div-modals').innerHTML = modals;
  modals = '';
}

// Get from Movies external API
async function getMovieInfo(search) {
  const url1 = `http://www.omdbapi.com/?s=${search}&apikey=thewdb`;
  const url2 = `http://www.omdbapi.com/?t=${search}&apikey=thewdb`;

  let res = await fetch(url1);
  let data = await res.json();
  if (data.hasOwnProperty('Search')){
    data = data.Search;
    sortSearch(data);
  } else {
    res = await fetch(url2);
    data = await res.json();
   sortSearch([data]);
  }
}

function sortSearch(results){
  let output = '';
  let IMDbArray = [];
  let displayedMovies = [];
  results.forEach(movie => {
    if(movie.Type != "game"){
      if(IMDbArray.includes(movie.imdbID)) {   
        console.log("Movie already displayed");
      } else {  
        output += drawSearchResults(movie);
        IMDbArray.push(movie.imdbID);
        displayedMovies.push(movie);
      }
    }
  });
  document.getElementById('output').innerHTML = output;
  window.scrollTo({
    top: 0,
    left: 0,
    behavior: 'smooth'
  });
  activateAddMovieButtons(displayedMovies);
}

function drawSearchResults(movie) {
  const searchBox = `
  <div class="card mx-auto mb-2 mr-3 " style="max-width: 423px;">
    <div class="row no-gutters">
      <div class="col-md-4">
        <img src="${movie.Poster}" class="card-img">
      </div>
      <div class="col-md-8">
        <div class="card-body">
          <h5 class="card-title"><strong>${movie.Title}</strong></h5>
          <p class="card-text"><a class="float-left" href="https://www.imdb.com/title/${movie.imdbID}" target="_blank"><img src="imdb-logo.png" alt="imdb-logo"></a></p>
          <p class="card-text text-center"><strong>Released: ${movie.Year}</strong></p>
            <p class="formats">Resolution:<br>
              <input type="checkbox" id="sd-${movie.imdbID}" name="resolution">
              <label for="sd-${movie.imdbID}">DVD/SD</label>
              <input type="checkbox" id="hd-${movie.imdbID}" name="resolution">
              <label for="hd-${movie.imdbID}">Blu-ray/HD</label>
              <input type="checkbox" id="uhd-${movie.imdbID}" name="resolution">
              <label for="uhd-${movie.imdbID}">4K/UHD</label>
              Format:<br>
              <input type="checkbox" id="disc-${movie.imdbID}" name="format" value="">
              <label for="disc-${movie.imdbID}">Disc</label>
              <input type="checkbox" id="digital-${movie.imdbID}" name="format">
              <label for="digital-${movie.imdbID}">Digital</label>
            <br>
            <span id="change-${movie.imdbID}"><button id="${movie.imdbID}" class="add-btn text-center btn  btn-primary">Add to MovieDB</button></span></p>
        </div>
      </div>
    </div>
  </div>
  `;
  return searchBox;
}

function activateAddMovieButtons(displayedMovies){
  displayedMovies.forEach(movie => {
    document.getElementById(`${movie.imdbID}`).addEventListener('click', function() {
      checkMovieAdded(movie.imdbID)
    });
  });
}

// Get selected Movie imdb search from external API
function checkMovieAdded(imdb) {
  if (movieDB.some(e => e.IMDb === imdb)) {
    // Checks to see if DB contains the movie already
    console.log("Duplicate. Movie not added.");
    document.getElementById(`change-${imdb}`).innerHTML = `<button class="btn-pressed btn btn-warning">Movie Already Existed</button>`;
  } else {
    // Movie isn't in DB so it is added
    addMovie(imdb);
    document.getElementById(`change-${imdb}`).innerHTML = `<button class="btn-pressed btn btn-success">Movie Added</button>`;
  }
}

function addMovie(imdb) {
  // Url specific to that movie's IMDb
  const url = `http://www.omdbapi.com/?i=${imdb}&apikey=thewdb`;
  // Form data for format and resolution
  const format = getFormat(document.getElementById("disc-"+imdb).checked, document.getElementById("digital-"+imdb).checked);
  const resolution = getResolution(document.getElementById("sd-"+imdb).checked, document.getElementById("hd-"+imdb).checked, document.getElementById("uhd-"+imdb).checked);
  // Second API call for more specific info
  fetch(url)
    .then(res => {
      return res.json();
    })
    .then(data => {
      const results = data;
      // Add movie to MovieDB using API call and form data
      const newMovie = {title: results.Title, rating: results.Rated, runtime: results.Runtime, release: results.Released, genre: results.Genre, format: format, res: resolution, IMDb: imdb};
      movieDB.push(newMovie);
      sortMovies();
      storeMovies();
      updateTableDisplay(movieDB);
    })
    .catch(err => {
      console.log(err);
    });
} 

function drawEditModals(movies, index) {
  let sd, hd, uhd, disc, digital;
  sd = hd = uhd = disc = digital = '';
  if(movies[index].format.includes('disc')) {
    disc = 'checked';
  } 
  if(movies[index].format.includes('digital')) {
    digital = 'checked';
  } 
  if(movies[index].res.includes('UHD')) {
    uhd = 'checked';
  } 
  if(movies[index].res.includes('HD')) {
    hd = 'checked';
  } 
  if(movies[index].res.includes('SD')) {
    sd = 'checked';
  } 

  modals += `
  <div class="modal fade" id="modal-${movies[index].IMDb}" tabindex="-1" role="dialog" aria-labelledby="${movies[index].IMDb}-Label" aria-hidden="true">
    <div class="modal-dialog" role="document">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="${movies[index].IMDb}-Label">Update <strong>${movies[index].title}:&nbsp</strong></h5>
          <button type="button" class="close" data-dismiss="modal" aria-label="Close">
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
        <div class="modal-body">
          <p class="formats">
            Genre: <input type="text" class="modal-genre" id="genre-${movies[index].IMDb}" name="genre" value="${movies[index].genre}">
            <br>
            <br>
            Resolution:
            <input type="checkbox" id="sd-${movies[index].IMDb}" name="resolution" ${sd}>
            <label for="sd-${movies[index].IMDb}">DVD/SD</label>
            <input type="checkbox" id="hd-${movies[index].IMDb}" name="resolution" ${hd}>
            <label for="hd-${movieDB[index].IMDb}">Blu-ray/HD</label>
            <input type="checkbox" id="uhd-${movies[index].IMDb}" name="resolution" ${uhd}>
            <label for="uhd-${movies[index].IMDb}">4K/UHD</label><br><br>
            Format:
            <input type="checkbox" id="disc-${movies[index].IMDb}" name="format" ${disc}>
            <label for="disc-${movies[index].IMDb}">Disc</label>
            <input type="checkbox" id="digital-${movies[index].IMDb}" name="format" ${digital}>
            <label for="digital-${movies[index].IMDb}">Digital</label>
          </p>
        </div>
        <div class="modal-footer">
          <button type="button" id="close-${movies[index].IMDb}" class="btn btn-secondary" data-dismiss="modal">Close</button>
          <button type="button" id="save-${movies[index].IMDb}" class="btn btn-primary">Save changes</button>
        </div>
      </div>
    </div>
  </div>
  `;
}

function editMovie(movies, tempIndex){
  const index = movieDB.map(function(e) { return e.title; }).indexOf(movies[tempIndex].title);
  document.getElementById(`close-${movieDB[index].IMDb}`).addEventListener('click', function() {
  });
  document.getElementById(`save-${movieDB[index].IMDb}`).addEventListener('click', function() {
    // Update movie genre
    movieDB[index].genre = document.getElementById(`genre-${movieDB[index].IMDb}`).value;
    // Update movie format
    movieDB[index].format = getFormat(document.getElementById("disc-"+movieDB[index].IMDb).checked, document.getElementById("digital-"+movieDB[index].IMDb).checked);
    // Update movie resolution
    movieDB[index].res = getResolution(document.getElementById("sd-"+movieDB[index].IMDb).checked, document.getElementById("hd-"+movieDB[index].IMDb).checked, document.getElementById("uhd-"+movieDB[index].IMDb).checked);
    // Calls to close modal automatically upon saving
    document.getElementById(`close-${movieDB[index].IMDb}`).click(); 
    storeMovies();
    updateTableDisplay(movies);
  });
}

function deleteMovie(movies, tempIndex){
  const index = movieDB.map(function(e) { return e.title; }).indexOf(movies[tempIndex].title);
  movieDB.splice(index, 1);
  storeMovies();
  updateTableDisplay(movieDB);
}

function storeMovies() {
  localStorage.setItem('movies', JSON.stringify(movieDB));
}

function emptyDatabase() {
  document.getElementById("nevermind").style.display = "none";
  movieDB = [];
  storeMovies();
  updateTableDisplay(movieDB);
}

function makeDatabaseFile() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(movieDB));
  let downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href",     dataStr);
  downloadAnchorNode.setAttribute("download", "movies.json");
  document.body.appendChild(downloadAnchorNode); 
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
}  

function readDatabaseFile() {
  document.getElementById('import').style.display = "block";
  document.getElementById('import').onclick = function() {
    let files = document.getElementById('selectFiles').files;
    if (files.length <= 0) {
      return false;
    }
    let fr = new FileReader();

    fr.onload = e => { 
      console.log(e);
      const result = JSON.parse(e.target.result);
      const stringMovies = JSON.stringify(result, null, 2);
      movieDB = JSON.parse(stringMovies);
      storeMovies();
      updateTableDisplay(movieDB);
      document.getElementById('import-btn').innerHTML = '';
    }

    fr.readAsText(files.item(0));
  };
}

function loadButtonListeners() {
  document.getElementById('nevermind').style.display = "none";
  document.getElementById("export").style.display = "block";
  document.getElementById("empty-btn").innerHTML = `
  <a class="nav-link pointer" id="empty">Empty Database</a>`;
  document.getElementById('empty').addEventListener('click', function() {
    document.getElementById("empty-btn").innerHTML = `
    <a class="nav-link pointer" id="confirm">Are you sure?</a>`;
    document.getElementById("nevermind").style.display = "block";
    document.getElementById('nevermind').addEventListener('click', function() {
      loadButtonListeners();
    })
    document.getElementById('confirm').addEventListener('click', function() {
      document.getElementById("empty-btn").innerHTML = `
      <a class="nav-link pointer" id="double-confirm">Last chance to rethink</a>`;
      document.getElementById('double-confirm').addEventListener('click', function() {
        emptyDatabase();
      });
    });
  });
  document.getElementById('export').addEventListener('click', function () {
    makeDatabaseFile();    
  }, false);
}

function getFormat(disc, digital){
  let format = '';
  // check digital or disc
  if(disc && digital) {
    format = "disc/digital";
  } else if(disc && !digital){
    format = "disc";
  } else if(digital){
    format = "digital";
  }
  return format;
}

function getResolution(sd, hd, uhd){
  let resolution = '';
  // check resolution
  if(sd) {
    if(hd && uhd) {
      resolution = "SD/HD/UHD";
    } else if (hd) {
      resolution = "SD/HD";
    } else if (uhd) {
      resolution = 'SD/UHD';
    } else {
      resolution = "SD";
    }
  } else if(hd) {
    if(uhd){
      resolution = "HD/UHD";
    } else {
      resolution = "HD";
    }
  } else if (uhd) {
    resolution = "UHD";
  }
  return resolution;
}

function getSortTitle(name) {
  let sortTitle = '';
  const articles = ['THE', 'A', 'AN'];
  if (articles.includes(name.substr(0,name.indexOf(' ')).toUpperCase())) {
    sortTitle = name.substr(name.indexOf(' ')+1);
  } else {
    sortTitle = name;
  }
  return sortTitle;
}

function sortMovies(){
  movieDB.sort((a, b) => {
    let textA = getSortTitle(a.title.toUpperCase());
    let textB = getSortTitle(b.title.toUpperCase());
    return (textA < textB) ? -1 : ((textA > textB) ? 1 : 0);
});
}

function drawTableRows(movies, movie) {
  let currentRow = 
    `<tr id="row-${movies.indexOf(movie)+1}">
      <td>${movies.indexOf(movie)+1}</td>
      <td>${movie.title}</td>
      <td>${movie.rating}</td>
      <td>${movie.release}</td>
      <td>${movie.runtime}</td>
      <td>${movie.genre}</td>
      <td>${movie.res}</td>
      <td>${movie.format}</td>
      <td><a class="imdb-logo" href="https://www.imdb.com/title/${movie.IMDb}" target="_blank"><img class="imdb-png" src="imdb-logo.png" alt="imdb-logo"></a></td>
      <td><a data-toggle="modal" data-target="#modal-${movie.IMDb}"><i class="fa fa-pencil-square-o pointer" id="edit-${movie.IMDb}" aria-hidden="true"></i></a></td>
      <td><i class="fa fa-trash-o pointer" id="delete-${movie.IMDb}" aria-hidden="true"></i></td>
    </tr>`;

  return currentRow;
}

// Activate buttons for edit and deleting
function enableEditDelete(movies) {
  movies.forEach(movie => {
    document.getElementById(`delete-${movie.IMDb}`).addEventListener('click', function(){
      deleteMovie(movies, movies.indexOf(movie));
    });
    document.getElementById(`edit-${movie.IMDb}`).addEventListener('click', function(){
      editMovie(movies, movies.indexOf(movie));
    });

    drawEditModals(movies, movies.indexOf(movie));
  });
}

// Filter the table by search
function filterMovies() {
  let filteredMovies = [];
  let search = document.getElementById('filter').value.toLowerCase();
  if(search != ''){ 
    movieDB.forEach(movie => {
      if (Object.values(movie).toString().toLowerCase().includes(search)) {
        filteredMovies.push(movie);
      }
    })
    updateTableDisplay(filteredMovies);
  } else {
    updateTableDisplay(movieDB);
  }
}