var AEMMobileAPI = require('aem-mobile-api')
var options = require('./api.json')
var dpsUtils = new AEMMobileAPI(options);
var dpsUtils2 = new AEMMobileAPI(JSON.parse(JSON.stringify(options)));
dpsUtils2.credentials.publication_id = "DEST_PUBLICATION_ID";

if (typeof options.access_token === 'undefined') {
  dpsUtils.getAccessToken()
  .then(function(data) {
    dpsUtils.credentials.access_token = data.access_token;
    return dpsUtils2.getAccessToken()
  })
  .then(function(data) {
    dpsUtils2.credentials.access_token = data.access_token;
    return dpsUtils.publicationGet('banner/ban_turkey_village_turkey');
  })
  .then(function(banner) {
    delete banner._links;
    delete banner.entityId;
    delete banner.publicationId;
    delete banner.version;
    console.log(banner);
    return dpsUtils2.putEntity(banner);
  })
  .then(function(response) {
    console.log(response);
  })
  .catch(function(err) {
    console.log(err.stack);
    console.log(err.response);
    console.log(err.data);
  });
}
function stripPublication(api, url) {
  var pubString = "/publication/"+api.credentials.publication_id+"/";
  console.log(url.slice(url.indexOf(pubString)+pubString.length, url.length-1));
  return url.slice(url.indexOf(pubString)+pubString.length, url.length-1)
}
/*
{ 
  abstract: 'Turkish tour guide Lale Surmen Aran explains how to make friends and enjoy the local culture in the small villages of Turkey.',
  title: 'Village Turkey',
  importance: 'normal',
  isAd: false,
  bannerTapAction: 'none',
  adType: 'static',
  url: 'https://google.com',
  shortAbstract: '17mins | 22MB | 07/2014',
  entityName: 'ban_turkey_village_turkey',
  entityType: 'banner',
}
 */
