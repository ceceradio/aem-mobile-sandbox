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
    return getAllLayouts();
  })
  .then(function(layouts) {
    console.log("layouts received");
    return q.all(layouts.map(copyLayout));
  })
  .then(function(copyResults) {
    console.log(copyResults);
  })
  .catch(function(err) {
    console.log(err.stack);
    console.log(err.response);
    console.log(err.data);
  });
}


function getEntityNameFromHref(input) {
  var pieces = input.split("/");
  var tmpPiece = pieces[4];
  return tmpPiece.substring(0, tmpPiece.indexOf(";"));
}

function getAllLayouts() {
  console.log("Starting");
  return dpsUtils.publicationGet('layout')
  .then(function(response) {
    return q.all(response.map(function(layout) {
      return dpsUtils.publicationGet("layout/"+getEntityNameFromHref(layout.href));
    }));
  });
}

function copyLayout(layout) {
  console.log("Copying Layout: " + layout.entityName + " " + layout.title);
  return getCards(layout._links.cardTemplates)
  .then(function(cards) {
    return q.all(cards.map(copyCard));
  })
  .then(function(cardHrefs) {
    var copy = {
      cellAspectRatio: layout.cellAspectRatio,
      useBackgroundImage: layout.useBackgroundImage,
      backgroundColor: layout.backgroundColor,
      lateralMargin: layout.lateralMargin,
      cellWidth: layout.cellWidth,
      gutter: layout.gutter,
      cardMappingRules: layout.cardMappingRules,
      title: layout.title,
      cellsPerLine: layout.cellsPerLine,
      contentOrdering: layout.contentOrdering,
      topMargin: layout.topMargin,
      layoutType: layout.layoutType,
      entityName: layout.entityName,
      entityType: layout.entityType,
      _links: {
        cardTemplates: cardHrefs
      }
    };
    if (!layout.cardMappingRules) {
      delete copy.cardMappingRules;
    }
    return [copy, dpsUtils2.publicationGet('layout/'+layout.entityName)];
  })
  .spread(function(copy, resp) {
    if (typeof resp.code === "undefined") {
      copy = _.merge(resp, copy)
    }
    console.log("Putting Layout: " + copy.title);
    return dpsUtils2.putEntity(copy);
  })
  .then(function(newLayout) {
    return { href: '/publication/'+dpsUtils2.credentials.publication_id+'/layout/'+newLayout.entityName+';version='+newLayout.version };
  });
}

function getCards(cardArray) {
  return q.all(cardArray.map(function(item) {
    return dpsUtils.publicationGet('cardTemplate/'+getEntityNameFromHref(item.href));
  }))
}

function copyCard(card) {
  console.log("Copying Card: "+card.title +" ("+card.entityName.substring(0,6)+")");
  var copy = {
    template: card.template,
    title: card.title,
    cardWidth: card.cardWidth,
    cardHeight: card.cardHeight,
    entityName: card.entityName,
    entityType: card.entityType
  };
  return dpsUtils2.publicationGet('cardTemplate/'+card.entityName)
  .then(function(destCard) {
    if (typeof destCard.code === "undefined") {
      copy = _.merge(destCard, copy);
    }
    return dpsUtils2.putEntity(copy);
  })
  .then(function(newCard) {
    return { href: '/publication/'+dpsUtils2.credentials.publication_id+'/cardTemplate/'+newCard.entityName+';version='+newCard.version };
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