document.getElementById('search').addEventListener('click', function() {
  var value = document.getElementById('search-box').value;
  getMovies(value);

});
document.getElementById('clear-search').addEventListener('click', function() {
  document.getElementById('output').innerHTML = '';
  document.getElementById('search-box').value = '';
});

let movies = [];
var databaseFile = null;

function populateMovieList(movies){
  if(movies.length > 0){
    loadEventListeners();
    document.getElementById("alert-container").innerHTML = ``;
    storeMovies(movies);
    let html = '';
    let counter = 0;
    movies.forEach(function(movies){
      counter++;
      html += `
      <tr>
        <td>${counter}</td>
        <td>${movies.title}</td>
        <td>${movies.rating}</td>
        <td>${movies.release}</td>
        <td>${movies.runtime}</td>
        <td>${movies.genre}</td>
        <td>${movies.res}</td>
        <td>${movies.format}</td>
        <td><a class="imdb-logo" href="https://www.imdb.com/title/${movies.imdb}" target="_blank"><img src="imdb-logo.png" alt="imdb-logo"></a></td>
        <td><i class="fa fa-trash-o" id="delete-${movies.imdb}" aria-hidden="true"></i></td>
      </tr>`;
    });
    // Insert into the DOM
    document.querySelector('.table-body').innerHTML = html;
    if(counter == 1){
      document.getElementById('totalMovies').textContent = counter + " movie";
    } else {
      document.getElementById('totalMovies').textContent = counter + " movies";
    }
      movies.forEach(function(movies){
      document.getElementById(`delete-${movies.imdb}`).addEventListener('click', function(){
        deleteMovie(movies.imdb);
      })
    });
  } else {
    document.getElementById("alert-container").innerHTML = `
    <div class="alert alert-danger" role="alert">
      You have no movies in your database. Search for movies to add.
    </div>`;
  }
}

// Get from Movies external API
function getMovies(search) {
  var url = `http://www.omdbapi.com/?s=${search}&apikey=thewdb`;
  fetch(url)
    .then(function(res){
      return res.json();
    })
    .then(function(data) {
      var results = data.Search;
      let output = '';
      results.forEach(function(user) {
        if(user.Type==="movie"){
          output += `
          <div class="card mb-2 mr-3" style="max-width: 423px;">
            <div class="row no-gutters">
              <div class="col-md-4">
                <img src="${user.Poster}" class="card-img">
              </div>
              <div class="col-md-8">
                <div class="card-body">
                  <h5 class="card-title"><strong>${user.Title}</strong></h5>
                  <p class="card-text"><a class="float-left" href="https://www.imdb.com/title/${user.imdbID}" target="_blank"><img src="imdb-logo.png" alt="imdb-logo"></a></p>
                  <p class="card-text text-center"><strong>Released: ${user.Year}</strong></p>
                    <p class="formats">Resolution:<br>
                      <input type="checkbox" id="sd-${user.imdbID}" name="resolution">
                      <label for="sd-${user.imdbID}">DVD/SD</label>
                      <input type="checkbox" id="hd-${user.imdbID}" name="resolution">
                      <label for="hd-${user.imdbID}">Blu-ray/HD</label>
                      <input type="checkbox" id="uhd-${user.imdbID}" name="resolution">
                      <label for="uhd-${user.imdbID}">4K/UHD</label>
                      Format:<br>
                      <input type="checkbox" id="disc-${user.imdbID}" name="format" value="">
                      <label for="disc-${user.imdbID}">Disc</label>
                      <input type="checkbox" id="digital-${user.imdbID}" name="format">
                      <label for="digital-${user.imdbID}">Digital</label>
                    <br>
                    <span id="change-${user.imdbID}"><button id="${user.imdbID}" class="add-btn text-center btn btn-sm btn-primary">Add to MovieDB</button></span></p>
                </div>
              </div>
            </div>
          </div>
        `;
        }
      });
      document.getElementById('output').innerHTML = output;
      results.forEach(function(user){
        if(user.Type==="movie"){
          document.getElementById(`${user.imdbID}`).addEventListener('click', function() {
            addMovie(user.imdbID);
          });
        }
      });
    })
    .catch(function(err){
      console.log(err);
    });
} 

// Get selected Movie imdb search from external API
function addMovie(imdb) {
  document.getElementById(`change-${imdb}`).innerHTML = `<button class="btn-pressed btn-sm btn btn-success">Movie Added</button>`;
  const url = `http://www.omdbapi.com/?i=${imdb}&apikey=thewdb`;
  let format, resolution;
  format = resolution = '';
  // check for format
  if(document.getElementById("sd-"+imdb).checked == true) {
    if(document.getElementById("hd-"+imdb).checked == true && document.getElementById("uhd-"+imdb).checked == true) {
      resolution = "SD/HD/UHD";
    } else if (document.getElementById("hd-"+imdb).checked == true) {
      resolution = "SD/HD";
    } else {
      resolution = "SD";
    }
  } else if(document.getElementById("hd-"+imdb).checked == true) {
    if(document.getElementById("uhd-"+imdb).checked == true){
      resolution = "HD/UHD";
    } else {
      resolution = "HD";
    }
  } else if (document.getElementById("uhd-"+imdb).checked == true) {
    resolution = "UHD";
  }
  // check digital or disc
  if(document.getElementById("disc-"+imdb).checked == true && document.getElementById("digital-"+imdb).checked == true) {
    format = "disc/digital";
  } else if(document.getElementById("disc-"+imdb).checked == true && document.getElementById("digital-"+imdb).checked == false){
    format = "disc";
  } else if(document.getElementById("digital-"+imdb).checked == true){
    format = "digital";
  }

  fetch(url)
    .then(function(res){
      return res.json();
    })
    .then(function(data) {
      let results = data;
      var sortTitle = '';
      if (data.Title.substr(0,4) === "The ") {
        sortTitle = data.Title.slice(4, data.Title.length);
      } else {
        sortTitle = data.Title;
      }
      const newMovie = {sortTitle: sortTitle, title: results.Title, rating: results.Rated, runtime: results.Runtime, release: results.Released, genre: results.Genre, format: format, res: resolution, imdb: imdb};
      movies.push(newMovie);
      sortMovies(movies);
      populateMovieList(movies);
      return newMovie;
    })
    .catch(function(err){
      console.log(err);
    });
} 

function deleteMovie(imdb){
  movies.forEach(function(movie){
    if(imdb == movie.imdb){
      movies.splice(movies.indexOf(movie), 1);
    }
  });
  storeMovies(movies);
  if(movies.length == 0){
    document.location.reload();
  } else {
  populateMovieList(movies);
  }
}

function storeMovies(movies) {
  let items = [];
  items = movies;
  localStorage.setItem('movies', JSON.stringify(items));
}

function getStoredMovies() {
  if(JSON.parse(localStorage.getItem('movies')) == null){
    populateMovieList(movies);
  } else {
    movies = JSON.parse(localStorage.getItem('movies'));
    populateMovieList(movies);
  }
}

function emptyDatabase() {
  movies = [];
  storeMovies(movies);
  document.location.reload();
}

function makeDatabaseFile(movies) {
  var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(movies));
  var downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href",     dataStr);
  downloadAnchorNode.setAttribute("download", "movies.json");
  document.body.appendChild(downloadAnchorNode); 
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
}  

function loadEventListeners() {
  document.getElementById("bottom-btn").innerHTML = `
  <button class="btn btn-info" id="download-btn">Export Database</button>
  <button class="btn btn-info" id="empty">Remove all movies</button>`;
  document.getElementById('empty').addEventListener('click', function() {
    document.getElementById("bottom-btn").innerHTML = `
    <button class="btn btn-info" id="download-btn">Export Database</button>
    <button class="btn btn-warning" id="confirm">Are you sure?</button>`;
    document.getElementById('confirm').addEventListener('click', function() {
      document.getElementById("bottom-btn").innerHTML = `
      <button class="btn btn-info" id="download-btn">Export Database</button>
      <button class="btn btn-danger" id="double-confirm">Last chance to rethink</button>`;
      document.getElementById('double-confirm').addEventListener('click', function() {
        emptyDatabase();
      });
    });
  });

  var download = document.getElementById('download-btn');

  download.addEventListener('click', function () {
    makeDatabaseFile(movies);    
  }, false);
}
var upload = document.querySelector(".file");
upload.addEventListener('change', function() {
  readDatabaseFile(upload);
})

function readDatabaseFile(upload) {
  document.getElementById('import-btn').innerHTML = `
  <button class="btn btn-info text-left" id="import">Import Selected File</button>`;
  upload.style.display = "none";
  document.getElementById('import').onclick = function() {
    var files = document.getElementById('selectFiles').files;
  if (files.length <= 0) {
    return false;
  }

  var fr = new FileReader();

  fr.onload = function(e) { 
  console.log(e);
    var result = JSON.parse(e.target.result);
    var stringMovies = JSON.stringify(result, null, 2);
    movies = JSON.parse(stringMovies);
    console.log(movies);
    storeMovies(movies);
    populateMovieList(movies);
  }

  fr.readAsText(files.item(0));
  };
}

function sortMovies(movies){
  movies.sort(function(a, b) {
    var textA = a.sortTitle.toUpperCase();
    var textB = b.sortTitle.toUpperCase();
    return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
});
}

getStoredMovies();