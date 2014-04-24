

	var rules = {};
	
		function processSheet(sheet, media, mediaText){

			//console.log('sheet', sheet);

			if(sheet.cssRules==null){
				return;
			}

			for (var i = 0; i < sheet.cssRules.length; i++) {
		    	var rule = sheet.cssRules[i];
		    	processRule(rule, sheet.href, media, mediaText);
			}

		}


		function processRule(rule, href, media, mediaText){

			mediaText = mediaText=='all' ? '' : mediaText;

			//console.log('rule', rule);

			if( typeof rule.selectorText != 'undefined' ){
				// style rule
				//console.log('style rule', mediaText, rule);
				

				var elementSelectorText = rule.selectorText;
				var ignoredPseudoElementsAndClasses = [':link', ':visited', ':active', ':hover', ':focus', '::before', '::after'];
				for(var i=0; i<ignoredPseudoElementsAndClasses.length; i++){
					var ignored = ignoredPseudoElementsAndClasses[i];
					elementSelectorText = elementSelectorText.replace(ignored,'');
				}
				
				var elementSelectorRules = rules[elementSelectorText] || [];
				elementSelectorRules.push({ 'href' : href, 'mediaText' : mediaText, 'rule': rule});
				rules[elementSelectorText] = elementSelectorRules;

				//console.log('style rule', elementSelectorText, href, mediaText, rule.selectorText);

				return;
			}

			// font-face don't has rule.media therefore should be skipped for now

			if( typeof(rule.media) == 'undefined'){
				console.log('missing media for ',rule);
				return;
			}

			var ruleMediaText = mediaText && rule.media.mediaText
								? mediaText + ' and ' + rule.media.mediaText
								: mediaText+ rule.media.mediaText;

			//console.log('media for media or import',ruleMediaText, ',', mediaText, ',',rule.media.mediaText);

			if( typeof rule.href != 'undefined' ){
				// import rule
				//console.log('import rule', rule.media.mediaText, rule);

				processSheet(rule.styleSheet, media, ruleMediaText );
			}

			if( typeof rule.cssRules != 'undefined' ){
				// media rule
				//console.log('media rule', rule.media.mediaText, rule);
				processSheet(rule, media, ruleMediaText );
			}

		}


		function processDocumentSheets(){

			console.clear();
			console.log('==============================');

			var sheets = document.styleSheets;
			for (var c = 0; c < sheets.length; c++) {
			    var sheet = sheets[c];
			    processSheet(sheet, sheet.media, sheet.media? sheet.media.mediaText : '');
			}

			//console.log('all document rules', rules);
		}

		function processElementRules(child, matchedSelectors){

			// skip #text nodes
			if( typeof(child.matches) == 'undefined' ) return;

			for(var rule in rules){
											
				if( rule!='' && child.matches(rule) ){
					//console.log('element rule', child, rule);
					matchedSelectors.push(rule);
				};
			}

			return matchedSelectors;
		}

		function processElement(element, matchedSelectors){
			
			//console.log('element', element);

			processElementRules(element, matchedSelectors);

			if(element.hasChildNodes()){
				for(var i=0; i<element.childNodes.length;i++){
					var childElement = element.childNodes[i];
					processElement(childElement, matchedSelectors);
				}
			}
			
			return matchedSelectors;
		}

		
		function getMatchedRules(matchedSelectors){

			var matchedRules = [];

			for(var i=0;i<matchedSelectors.length;i++){
				var selector = matchedSelectors[i];					
				var selectorRules = rules[selector];

				//console.log(selector, selectorRules);

				for(var j=0; j<selectorRules.length;j++){

					var rule = selectorRules[j];
					matchedRules.push(rule);
					//console.log('rule matched to element', rule.rule.cssText);
				}	
			}

			return matchedRules;
		}

		function getElementStylesGroupedByMediaText(element){

			var selectors = processElement(element,[]);
			
			//console.log('all rules matched to element', element, selectors);

			var elementRules = getMatchedRules(selectors);

			//console.log('all rules matched to element', element, elementRules);

			var rulesGroupedByMediaText = {};

			for(var i=0; i<elementRules.length;i++){

					var rule = elementRules[i];
					var mediaText = rule.mediaText || '';

					var rulesByMedia = rulesGroupedByMediaText[mediaText] || [];

					rulesByMedia.push(rule.rule.cssText);

					rulesGroupedByMediaText[mediaText] = rulesByMedia;
					//console.log('rule with media', mediaText, ',' , rule.rule.selectorText);
			}

			return rulesGroupedByMediaText;
		}

		function getElementCss(element){

			var css = '';

			var stylesGroupedByMediaText = getElementStylesGroupedByMediaText(element);
			//console.log('element styles', element, stylesGroupedByMediaText);

			for(var mediaText in stylesGroupedByMediaText){

				var cssByMedia = stylesGroupedByMediaText[mediaText].join('\r\n')+'\r\n';

				if(mediaText!=''){

					cssByMedia = '@media ' + mediaText + '{\r\n' + cssByMedia + '}'+'\r\n';
				}

				css += cssByMedia;
			}

			return css;
		}

		function processDocument(){

			processDocumentSheets();

		var selector = prompt("Enter an element's selector",'');

			var elements = $(selector);
			
			if(elements.length!=1){
				alert("element by this selector isn't unique!");
				return;
			}

			var element = elements[0];
			var css = getElementCss(element);
			var html = element.outerHTML;

			var source = "<style>\r\n"+css+"\r\n</style>"+html;
			console.log(source);
			
			document.body.innerText = source;
			
		}

	$(document).ready(function(){
		window.setTimeout(processDocument,1000);
	});
