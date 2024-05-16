/**
 * Script: Women in Red randomizer tool item
 * 
 */

messages = {
	'en': {
		'wir-title': 'Hello!',
		'wir-greeting': 'Welcome, $1!',
		'wir-info': 'The following items have no page yet, you can create them:',
		'wir-link': 'List of Women in Red',
		'wir-tooltip': 'Shows Women in Red Lists'
	},
	'tr': {
		'wir-title': 'Merhaba!',
		'wir-greeting': 'Hoş geldin, $1!',
		'wir-info': 'Aşağıdaki öğelerin henüz sayfası yok, sen oluşturabilirsin:',
		'wir-link': 'Kırmızılı Kadınlar Listesi',
		'wir-tooltip': 'Sayfası eksik olan kadın biyografilerini gösterir'
	}
};

mw.messages.set(messages['en']);
var lang = mw.config.get('wgUserLanguage');
if (lang && lang != 'en' && lang in messages) {
	mw.messages.set(messages[lang]);
}

// Import the jQuery dialog plugin before starting the rest of this script
mw.loader.using(['jquery.ui'], function () {

	const sparqlEndpoint = 'https://query.wikidata.org/sparql';

	// SPARQL query
	const sparqlQuery = `
	SELECT ?item ?itemLabel ?linkcount WHERE {
		?item wdt:P31 wd:Q5 .
		?item wdt:P21 wd:Q6581072 .
		?item wdt:P106 wd:Q5716684 .
		?item wikibase:sitelinks ?linkcount .
	  FILTER (?linkcount >= 1) .       # only include items with 1 or more sitelinks
	  FILTER NOT EXISTS {
		?article schema:about ?item .
		?article schema:inLanguage "tr" .
		?article schema:isPartOf <https://tr.wikipedia.org/>
	  }
	  SERVICE wikibase:label { bd:serviceParam wikibase:language "en,de,es,ar,fr" }
	}
	ORDER BY DESC(?linkcount)
	LIMIT 300
	`;

	function renderQuickRCDialog(pageLinks) {
		var $dialog = $('<div></div>')
			.html(
				'<strong>' +
				mw.message('wir-greeting', mw.user.getName()).escaped() +
				'</strong> ' +
				mw.message('wir-info').escaped() +
				'<br/><ul><li>' +
				pageLinks.join('<br /><li>') + '</ul>'
			)
			.dialog({
				autoOpen: true,
				title: mw.message('wir-title').plain(),
				width: '70%',
				modal: true
			});
	}

	// Function to execute the SPARQL query
	function executeSPARQLQuery(query) {

		const url = sparqlEndpoint + '?query=' + encodeURIComponent(query);
		const headers = {
			'Accept': 'application/sparql-results+json'
		};

		fetch(url, { headers })
			.then(response => response.json())
			.then(data => handleSparqlResult(data))
			.catch(error => console.error('Error executing SPARQL query:', error));
	}

	// Function to handle the SPARQL result
	function handleSparqlResult(data) {

		var myPageLinks = [];
		var myTitles = [];

		const results = data.results.bindings;
		console.log('SPARQL query results:', results);
		// Process and display the results as needed
		results.forEach(result => {
			const itemLink = result.item.value;
			const nameSurname = result.itemLabel.value;
			console.log(`Item: ${itemLink}, Label: ${nameSurname}`);

			myPageLinks.push(
				mw.html.element(
					'a', { href: mw.util.getUrl( itemLink ) }, nameSurname
				)
			);

			myTitles.push(nameSurname);
		});
		renderQuickRCDialog(myPageLinks);
	}

	$(document).ready(function () {

		// Add a link to the toolbox
		var link = mw.util.addPortletLink(
			'p-tb',
			'#',
			mw.message('wir-link').plain(),
			't-prettylinkwidget',
			mw.message('wir-tooltip').plain(),
			'/',
			'#t-whatlinkshere'
		);

		// Create a jQuery object for this link so that we get
		// to use jQuery awesomeness like .click() for binding functions to events
		// and methods like e.preventDefault();
		$(link).click(function (e) {
			// Avoid the browser going to '#'
			e.preventDefault();

			// generate women in red list!
			executeSPARQLQuery(sparqlQuery);
		});

	});

});
