const apiKey = '430015d32679c5f6bdfb5894f99730cd';
let genreMap = {};

function fetchMovieDetails(movieId) {
  return $.getJSON(`https://api.themoviedb.org/3/movie/${movieId}?api_key=${apiKey}`);
}

function fetchGenres() {
  return $.getJSON(`https://api.themoviedb.org/3/genre/movie/list?api_key=${apiKey}`)
    .then(data => {
      data.genres.forEach(genre => {
        genreMap[genre.id] = genre.name;
      });
    });
}

function fetchAverageRating(movieId) {
  return $.getJSON('get_average_rating.php', { movie_id: movieId });
}

function showInlineMessage(starsContainer, message, isError = false) {
  starsContainer.prev('.rating-message').remove();
  const msg = $('<div class="rating-message"></div>').text(message);
  if (isError) msg.addClass('error');
  starsContainer.before(msg);
  msg.fadeIn().delay(2000).fadeOut(() => msg.remove());
}

$(document).on('mouseenter', '.star', function () {
  const value = $(this).data('value');
  $(this).parent().children().each(function () {
    $(this).toggleClass('hover', $(this).data('value') <= value);
  });
});

$(document).on('mouseleave', '.stars', function () {
  $(this).children().removeClass('hover');
});

$(document).on('click', '.star', function () {
  const value = $(this).data('value');
  const starsContainer = $(this).parent();
  const stars = starsContainer.children();
  const movieId = starsContainer.data('movie-id');

  $.ajax({
    url: 'rate_movie.php',
    method: 'POST',
    contentType: 'application/json',
    data: JSON.stringify({ movie_id: movieId, rating: value }),
    success: function (response) {
      if (response.success) {
        stars.each(function () {
          $(this).toggleClass('selected', $(this).data('value') <= value);
        });
        showInlineMessage(starsContainer, 'Thanks for rating!');
        loadTopSearches();
        if (response.avg_rating !== undefined) {
          $(`.movie[data-movie-id="${movieId}"] .avg-rating`).text(`Average Rating: ${parseFloat(response.avg_rating).toFixed(1)} ⭐`);
          $('#modalBody').find('.avg-rating').text(`Average Rating: ${parseFloat(response.avg_rating).toFixed(1)} ⭐`);
        }
      } else {
        showInlineMessage(starsContainer, 'Error saving rating.', true);
      }
    },
    error: function () {
      showInlineMessage(starsContainer, 'Failed to send rating.', true);
    }
  });
});

$('#searchBtn').click(async function () {
  const query = $('#searchQuery').val().trim();
  if (!query) return showInlineMessage($('#searchQuery'), 'Please enter a movie title.', true);

  $('#searchSection').show();
  $('#results').html('<p>Loading...</p>');

  await fetchGenres();

  $.getJSON('fetch_movies.php', { query }, async function (data) {
    if (data.error) {
      $('#results').html(`<p>Error: ${data.error}</p>`);
      return;
    }

    if (data.results.length === 0) {
      $('#results').html('<p>No movies found.</p>');
      return;
    }

    let html = '';
    for (const movie of data.results) {
      let avgRating = 0;
      try {
        const ratingResp = await fetchAverageRating(movie.id);
        avgRating = ratingResp.avg_rating || 0;
      } catch (e) {}

      const posterUrl = movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : '';
      const genreNames = movie.genre_ids.map(id => genreMap[id]).filter(Boolean).join(', ');

      html += `
        <div class="movie" data-movie-id="${movie.id}">
          <h2>${movie.title} (${movie.release_date?.slice(0, 4) || 'N/A'})</h2>
          ${posterUrl ? `<img src="${posterUrl}" alt="${movie.title} poster">` : ''}
          <p>${movie.overview || 'No description available.'}</p>
          <p><strong>Genres:</strong> ${genreNames || 'Unknown'}</p>
          <div class="avg-rating">Average Rating: ${avgRating.toFixed(1)} ⭐</div>
          <div class="stars" data-movie-id="${movie.id}">
            ${[1, 2, 3, 4, 5].map(i => `<span class="star" data-value="${i}">&#9733;</span>`).join('')}
          </div>
        </div>
      `;
    }

    $('#results').html(html);
    loadTopSearches();
  });
});

$(document).on('click', '.movie', async function (e) {
  if ($(e.target).hasClass('star')) return;

  const movieId = $(this).data('movie-id');
  const details = await fetchMovieDetails(movieId);
  const ratingResp = await fetchAverageRating(movieId);
  const avgRating = ratingResp.avg_rating || 0;
  const genres = details.genres.map(g => g.name).join(', ');
  const poster = details.poster_path ? `https://image.tmdb.org/t/p/w500${details.poster_path}` : '';

  $('#modalBody').html(`
    <h2>${details.title}</h2>
    ${poster ? `<img src="${poster}" />` : ''}
    <p><strong>Release Date:</strong> ${details.release_date}</p>
    <p><strong>Genres:</strong> ${genres}</p>
    <p><strong>Overview:</strong> ${details.overview || 'No description available.'}</p>
    <p class="avg-rating"><strong>Average Rating:</strong> ${avgRating.toFixed(1)} ⭐</p>
    <div class="stars" data-movie-id="${movieId}">
      ${[1, 2, 3, 4, 5].map(i => `<span class="star" data-value="${i}">&#9733;</span>`).join('')}
    </div>
  `);

  $('#movieModal').fadeIn();
});

$(document).on('click', '.close', function () {
  $('#movieModal').fadeOut();
});

$(document).on('click', '#movieModal', function (e) {
  if ($(e.target).is('#movieModal')) {
    $('#movieModal').fadeOut();
  }
});

function loadTopSearches() {
    $.getJSON('top_movies.php', function (movies) {
        let html = '';
        movies.forEach(movie => {
            html += `
                <div class="movie" data-movie-id="${movie.movie_id}" style="cursor: pointer;">
                    <h3>${movie.title} - ${movie.search_count} searches</h3>
                    ${movie.poster_url ? `<img src="${movie.poster_url}" alt="${movie.title} poster" />` : ''}
                </div>
            `;
        });
        $('#topSearches').html(html);
    });
}


$(document).ready(function () {
  loadTopSearches();
});

$('#searchQuery').on('keydown', function (e) {
    if (e.key === 'Enter') {
        $('#searchBtn').click();
    }
});

