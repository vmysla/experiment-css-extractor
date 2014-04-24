

	var rules = {};
	var rulesCount=0;

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
				elementSelectorRules.push({ 'href' : href, 'mediaText' : mediaText, 'rule': rule, order: rulesCount++});
				rules[elementSelectorText] = elementSelectorRules;

				//console.log('style rule', elementSelectorText, href, mediaText, rule.selectorText);

				return;
			}

			// font-face don't has rule.media therefore should be skipped for now

			//if( typeof(rule.media) == 'undefined'){
				//console.log('missing media for ',rule);
				//return;
			//}

			var ruleMediaText = typeof rule.media == 'undefined' ? '' : rule.media.mediaText;
			    ruleMediaText = mediaText && ruleMediaText
								? mediaText + ' and ' + ruleMediaText
								: mediaText+ ruleMediaText;

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

		function processElementRules(element, rule, matchedSelectors){

			// skip #text nodes
			if( typeof(element.matches) == 'undefined' ) return false;

			if(element.matches(rule) ){
					//console.log('element rule', element, rule);
					matchedSelectors.push(rule);
					return true;
			};

			if(element.hasChildNodes()){
				for(var i=0; i<element.childNodes.length;i++){
					var childElement = element.childNodes[i];
					var matched = processElementRules(childElement, rule, matchedSelectors);
					if(matched) return true;
				}
			}

			return false;
		}

		function processElement(element, matchedSelectors){

			//console.log('element', element);

			for(var rule in rules){
				if( rule!=''){
					//console.log('check rule for element ', element, rule);
					processElementRules(element, rule, matchedSelectors);
				};
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

			return matchedRules.sort(function(a, b) {return a.order - b.order; });
		}

		function getElementStylesGroupedByMediaText(element){

			var selectors = processElement(element,[]);
			
			//console.log('all rules matched to element', element, selectors);

			var elementRules = getMatchedRules(selectors);

			console.log('all rules matched to element', element, elementRules);

			var rulesGroupedByMediaText = [];

			var current = { MediaText : '', Rules : [] };
			

			for(var i=0; i<elementRules.length;i++){

					var rule = elementRules[i];
					var mediaText = rule.mediaText || '';

					if(mediaText != current.MediaText) {
						if(current.Rules.length>0){
							rulesGroupedByMediaText.push(current);
						}
						current = { MediaText : mediaText, Rules : [] };
					}
											
					current.Rules.push(rule.rule.cssText);
					
					//console.log('rule with media', mediaText, ',' , rule.rule.selectorText);
			}

			rulesGroupedByMediaText.push(current);

			return rulesGroupedByMediaText;
		}

		function getElementCss(element){

			var css = '';

			var stylesGroupedByMediaText = getElementStylesGroupedByMediaText(element);
			//console.log('element styles', element, stylesGroupedByMediaText);

			for(var i=0;i<stylesGroupedByMediaText.length;i++){

				var mediaText = stylesGroupedByMediaText[i].MediaText;

				var cssByMedia = stylesGroupedByMediaText[i].Rules.join('\r\n')+'\r\n';

				if(mediaText!=''){

					cssByMedia = '@media ' + mediaText + '{\r\n' + cssByMedia + '}'+'\r\n';
				}

				css += cssByMedia;
			}

			return css;
		}

		function processDocument(){

			processDocumentSheets();

		var selector = '.lso';//'.default';//prompt("Enter an element's selector",'');

			var elements = $(selector);
			
			if(elements.length!=1){
				alert("element by this selector isn't unique!");
				return;
			}

			var element = elements[0];
			var css = getElementCss(element);
			var html = element.outerHTML;

			var source = "<style>\r\n"+css+"\r\n</style>"+html;
			source = source.replace(/url\(\//ig, 'url('+document.location.origin+'/');
			source = source.replace(/src=\"\//ig, 'src="'+document.location.origin+'/');
			source = source.replace(/src=\i\//ig, 'src=\''+document.location.origin+'/');

			console.log(source);
			
			
			document.body.innerText = source;

			return;
			var iframe = document.createElement('iframe');
			var html = '<body>Foo</body>';
			document.body.appendChild(iframe);
			iframe.contentWindow.document.open();
			iframe.contentWindow.document.write(source);
			iframe.contentWindow.document.close();
						
		}

	$(document).ready(function(){
		window.setTimeout(processDocument,1000);
	});
