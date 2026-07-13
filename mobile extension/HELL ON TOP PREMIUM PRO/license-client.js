// Simple license client for extension
(function(){
  const API = 'http://localhost:3000/api';
    const PRIMARY_API = 'https://hell-on-top.onrender.com/api';
    const FALLBACK_API = 'https://hell-on-top-2.onrender.com/api';
    async function fetchWithFallback(path, opts){
      try{
        const res = await fetch(PRIMARY_API + path, opts);
        if(res.ok) return res;
      }catch(e){}
      return await fetch(FALLBACK_API + path, opts);
    }
  // Ensure a persistent client id per extension install
  function getClientId(){
    let id = localStorage.getItem('license_client_id');
    if(!id){ id = 'cli_' + Math.random().toString(36).slice(2,10); localStorage.setItem('license_client_id', id); }
    return id;
  }
  const CLIENT_ID = getClientId();
  async function validate(key){
    try{
        const res = await fetchWithFallback('/keys/validate', {method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({key})});
      return await res.json();
    }catch(e){return {valid:false,error:e.message}};
  }
  async function claim(key){
    try{
        const res = await fetchWithFallback('/keys/claim', {method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({key,clientId:CLIENT_ID})});
      return await res.json();
    }catch(e){return {ok:false,error:e.message}};
  }
  async function report(key, seconds){
    try{
        await fetchWithFallback('/usage/report', {method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({key,seconds})});
    }catch(e){}
  }

  window.licenseClient = { validate, report };
})();
