// Simple license client for extension
(function(){
  const API = 'http://localhost:3000/api';
  // Ensure a persistent client id per extension install
  function getClientId(){
    let id = localStorage.getItem('license_client_id');
    if(!id){ id = 'cli_' + Math.random().toString(36).slice(2,10); localStorage.setItem('license_client_id', id); }
    return id;
  }
  const CLIENT_ID = getClientId();
  async function validate(key){
    try{
      const res = await fetch(API + '/keys/validate', {method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({key})});
      return await res.json();
    }catch(e){return {valid:false,error:e.message}};
  }
  async function claim(key){
    try{
      const res = await fetch(API + '/keys/claim', {method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({key,clientId:CLIENT_ID})});
      return await res.json();
    }catch(e){return {ok:false,error:e.message}};
  }
  async function report(key, seconds){
    try{
      await fetch(API + '/usage/report', {method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({key,seconds})});
    }catch(e){}
  }

  window.licenseClient = { validate, report };
})();
