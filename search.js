<!-- Lunr (CDN) -->
<script src="https://unpkg.com/lunr/lunr.js"></script>

<script>
  // debounce helper
  function debounce(fn, wait=200){
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(()=>fn(...args), wait); };
  }

  let docs = [];
  let idx;

  async function initSearch(){
    try {
      const res = await fetch('/search_index.json');
      docs = await res.json();

      idx = lunr(function () {
        this.ref('id');
        this.field('title', { boost: 10 });
        this.field('content');
        const that = this;
        docs.forEach(function (doc) { that.add(doc); });
      });

      const input = document.getElementById('search-input');
      if (input) input.addEventListener('input', debounce(onSearch, 150));
    } catch (err) {
      console.error('Search init failed', err);
    }
  }

  function snippet(text, q){
    if(!text) return '';
    const i = q ? text.toLowerCase().indexOf(q.toLowerCase()) : -1;
    if(i >= 0){
      const start = Math.max(0, i - 40);
      return (start ? '…' : '') + text.slice(start, start + 160) + (text.length > start + 160 ? '…' : '');
    }
    return text.length > 160 ? text.slice(0,160) + '…' : text;
  }

  function onSearch(e){
    const q = e.target.value.trim();
    const resultsEl = document.getElementById('search-results');
    if(!q){ resultsEl.innerHTML = ''; return; }

    let results = [];
    try {
      results = idx.search(q + '*'); // wildcard for broader matches
    } catch(e) {
      results = idx.search(q.split(/\s+/).map(t=>t+'*').join(' '));
    }

    if(!results.length){
      resultsEl.innerHTML = '<p class="no-results">No results</p>';
      return;
    }

    const html = results.slice(0,10).map(r => {
      const d = docs.find(x => x.id === r.ref);
      return `<article class="sr-item">
        <a class="sr-title" href="${d.url}">${d.title}</a>
        <p class="sr-snippet">${snippet(d.content, q)}</p>
      </article>`;
    }).join('');
    resultsEl.innerHTML = html;
  }

  document.addEventListener('DOMContentLoaded', initSearch);
</script>
