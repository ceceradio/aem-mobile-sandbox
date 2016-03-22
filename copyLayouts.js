var AEMMobileAPI = require('./aem-mobile-api.js')
var q = require('q')
var _ = require('lodash')
var options = require('./api.json')
var src_publication_id = options.publication_id;
var dest_publication_id = "DEST_PUBLICATION_ID"
var dpsUtils = new AEMMobileAPI(options);
var allCollections = [];
if (typeof options.access_token === 'undefined') {
  dpsUtils.getAccessToken()
  .then(function(data) {
    dpsUtils.credentials.access_token = data.access_token;
    var root = {};

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
    for (var i = 0; i < data.length; i++) {
      var item = data[i];
      promiseChain.then(function(result) {
        if (result) {
          results.push(result);
        }
        var entityName = getEntityNameFromHref(item.href);
        return copyLayout(entityName);
      })
    }
    return promiseChain.then(function(result) {
      if (result) {
        results.push(result);
      }
      return results;
    });
  });
}

function copyLayout(layoutId) {
  console.log("Copy Layout: " + layoutId);
  var copy;
  var data;
  return dpsUtils.publicationGet('layout/'+layoutId)
  .then(function(templateData) {
    data = templateData;
    return copyCardTemplates(data._links.cardTemplates)
  })
  .then(function(newCardTemplates) {
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
    dpsUtils.credentials.publication_id = dest_publication_id;
    return dpsUtils.publicationGet('layout/'+layoutId);
  })
  .then(function(resp) {
    if (typeof resp.code === "undefined") {
      copy = _.merge(resp, copy)
    }
    return dpsUtils.putEntity(copy);
  })
  .then(function(data) {
    dpsUtils.credentials.publication_id = src_publication_id;
    return { href: '/publication/'+dest_publication_id+'/layout/'+data.entityName+';version='+data.version };
  });
}

function copyCardTemplates(cardTemplates) {
  console.log("Copying Card Templates");
  var results = [];
  var promiseChain = q();
  for (var i = 0; i < cardTemplates.length; i++) {
    var item = cardTemplates[i];
    promiseChain.then(function(result) {
      if (result) {
        results.push(result);
      }
      var currentTemplate = getEntityNameFromHref(item.href);
      return copyCardTemplate(currentTemplate);
    })
  }
  return promiseChain.then(function(result) {
    if (result) {
      results.push(result);
    }
    return results;
  })
}

function copyCardTemplate(entityName) {
  console.log("Copying Card Template: "+entityName);
  var copy;
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
    dpsUtils.credentials.publication_id = dest_publication_id;
    return dpsUtils.publicationGet('cardTemplate/'+data.entityName);
  })
  .then(function(resp) {
    if (typeof resp.code === "undefined") {
      copy = _.merge(resp, copy);
    }
    return dpsUtils.putEntity(copy);
  })
  .then(function(data) {
      dpsUtils.credentials.publication_id = src_publication_id;
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