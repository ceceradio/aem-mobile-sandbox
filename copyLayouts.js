var AEMMobileAPI = require('aem-mobile-api')
var q = require('q')
var _ = require('lodash')
var options = require('./api.json')
var src_publication_id = options.publication_id;
var dest_publication_id = "DEST_PUBLICATION_ID"
var dpsUtils = new AEMMobileAPI(options);
var dpsUtils2 = new AEMMobileAPI(JSON.parse(JSON.stringify(options)));
dpsUtils2.credentials.publication_id = dest_publication_id;
var allCollections = [];
if (typeof options.access_token === 'undefined') {
  dpsUtils.getAccessToken()
  .then(function(data) {
    dpsUtils.credentials.access_token = data.access_token;
    return dpsUtils2.getAccessToken()
  })
  .then(function(data) {
    dpsUtils2.credentials.access_token = data.access_token;
    return copyAllLayouts();
  })
  .then(function(ret) {
    console.log("done");
    //console.log("Layout Copies: ");
    console.log(ret);
  }).catch(function(err) {
    console.log(err);
  });
}

function getEntityNameFromHref(input) {
  var pieces = input.split("/");
  var tmpPiece = pieces[4];
  return tmpPiece.substring(0, tmpPiece.indexOf(";"));
}

function copyAllLayouts() {
  var results = [];
  var data = [];
  console.log("Starting");
  return dpsUtils.publicationGet('layout').
  then(function(response) {
    data = response;
    var promiseChain = q();
    var count = data.length; // keep track of this since we're popping asynchronously
    for (var i = 0; i < count; i++) {
      promiseChain = promiseChain
      .then(function() {
        var entityName = getEntityNameFromHref(data.pop().href);
        return copyLayout(entityName);
      })
      .then(function(result) {
        results.push(result);
      })
    }
    return promiseChain.then(function() {
      return results;
    });
  });
}

function copyLayout(layoutId) {
  console.log("Copy Layout: " + layoutId);
  return dpsUtils.publicationGet('layout/'+layoutId)
  .then(function(templateData) {
    return [templateData, copyCardTemplates(templateData._links.cardTemplates)]
  })
  .spread(function(data, newCardTemplates) {
    copy = {
      cellAspectRatio: data.cellAspectRatio,
      useBackgroundImage: data.useBackgroundImage,
      backgroundColor: data.backgroundColor,
      lateralMargin: data.lateralMargin,
      cellWidth: data.cellWidth,
      gutter: data.gutter,
      cardMappingRules: data.cardMappingRules,
      title: data.title,
      cellsPerLine: data.cellsPerLine,
      contentOrdering: data.contentOrdering,
      topMargin: data.topMargin,
      layoutType: data.layoutType,
      entityName: data.entityName,
      entityType: data.entityType,
      _links: {
        cardTemplates: newCardTemplates
      }
    };
    return [data, copy, dpsUtils2.publicationGet('layout/'+layoutId)];
  })
  .spread(function(data, copy, resp) {
    if (typeof resp.code === "undefined") {
      copy = _.merge(resp, copy)
    }
    return dpsUtils2.putEntity(copy);
  })
  .then(function(data) {
    return { href: '/publication/'+dest_publication_id+'/layout/'+data.entityName+';version='+data.version };
  });
}

function copyCardTemplates(cardTemplates) {
  console.log("Copying Card Templates");
  var results = [];
  var promiseChain = q();
  var count = cardTemplates.length; // keep track of this since we're popping asynchronously
  for (var i = 0; i < count; i++) {
    promiseChain = promiseChain
      .then(function() {
        var currentTemplate = getEntityNameFromHref(cardTemplates.pop().href);
        return copyCardTemplate(currentTemplate);
      })
      .then(function(result) {
        results.push(result);
      })
  }
  return promiseChain.then(function() {
    return results;
  })
}

function copyCardTemplate(entityName) {
  console.log("Copying Card Template: "+entityName);
  return dpsUtils.publicationGet('cardTemplate/'+entityName)
  .then(function(data) {
     copy = {
      template: data.template,
      title: data.title,
      cardWidth: data.cardWidth,
      cardHeight: data.cardHeight,
      entityName: data.entityName,
      entityType: data.entityType
    };
    return [copy, dpsUtils2.publicationGet('cardTemplate/'+data.entityName)];
  })
  .spread(function(copy, resp) {
    if (typeof resp.code === "undefined") {
      copy = _.merge(resp, copy);
    }
    return dpsUtils2.putEntity(copy);
  })
  .then(function(data) {
      return { href: '/publication/'+dest_publication_id+'/cardTemplate/'+data.entityName+';version='+data.version };
  });
}


/*
LAYOUT

cellAspectRatio: 3.5,
useBackgroundImage: true,
backgroundColor: '#FFFFFF',
lateralMargin: '30dip',
cellWidth: 'auto',
gutter: '20dip',
cardMappingRules: 
 [ { ruleName: 'location',
     contentType: 'all',
     cardTemplate: '0a671f3b-bf67-5eb0-6b1e-e7ce6f8c28e7' } ],
title: '1-column-locations',
cellsPerLine: 1,
contentOrdering: [ 'implicit' ],
topMargin: '30dip',
layoutType: 'browsePage',
_links: {
  cardTemplates: [
    { href: '' }
  ]
}
*/

/*

{ 
  template: 
   { layout: 'no-image',
     'background-opacity': 0.35,
     'background-color': '#000000',
     'border-top-width': '1dip',
     'border-bottom-width': '1dip',
     'border-left-width': '1dip',
     'border-right-width': '1dip',
     'border-top-color': '#0D2738',
     'border-bottom-color': '#0D2738',
     'border-left-color': '#0D2738',
     'border-right-color': '#0D2738',
     image: {},
     metadata: 
      { 'margin-top': '0dip',
        'margin-right': '0dip',
        'margin-bottom': '0dip',
        'margin-left': '0dip',
        'padding-top': '0dip',
        'padding-right': '0dip',
        'padding-bottom': '5dip',
        'padding-left': '0dip',
        'background-opacity': 0,
        'background-color': '#FFFFFF',
        'vertical-align': 'middle',
        content: [Object] } },
  title: 'location',
  cardWidth: 1,
  cardHeight: 1,
  entityName: '0a671f3b-bf67-5eb0-6b1e-e7ce6f8c28e7',
  entityType: 'cardTemplate',
*/