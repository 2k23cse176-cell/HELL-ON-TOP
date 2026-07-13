document.addEventListener('DOMContentLoaded', async ()=>{
  const keyInput = document.getElementById('key');
  const status = document.getElementById('status');
  const save = document.getElementById('save');
  const clear = document.getElementById('clear');
  chrome.storage.local.get(['license_key'], (res)=>{ if(res.license_key) keyInput.value = res.license_key; });
  save.onclick = async ()=>{
    const k = keyInput.value.trim();
    if(!k) return;
    status.textContent = 'Validating...';
    const r = await (window.licenseClient && window.licenseClient.validate ? window.licenseClient.validate(k) : {valid:false});
    if(r && r.valid){
      const cl = await (window.licenseClient.claim ? window.licenseClient.claim(k) : {ok:false});
      if(cl && cl.ok){
        chrome.storage.local.set({license_key:k}, ()=>{ status.textContent='Key applied — reloading tabs'; });
        chrome.tabs.query({}, function(tabs){ tabs.forEach(t=>{ try{ chrome.tabs.sendMessage(t.id, {type:'setLicense', key:k}); }catch(e){} }); });
      } else { status.textContent = 'Claim failed: ' + (cl && cl.error ? cl.error : 'unknown'); }
    } else { status.textContent = 'Invalid key'; }
  };
  clear.onclick = ()=>{
    chrome.storage.local.remove('license_key', ()=>{ status.textContent='Removed key'; keyInput.value=''; chrome.tabs.query({}, function(tabs){ tabs.forEach(t=>{ try{ chrome.tabs.sendMessage(t.id, {type:'setLicense', key:''}); }catch(e){} }); }); });
  };
});
