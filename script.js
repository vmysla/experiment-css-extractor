	var rules = {};
	var rulesCount=0;
	var globalCss = "";

		function processSheet(sheet, media, mediaText){

			//console.log('sheet', sheet);

			if(sheet.cssRules==null){
				return;
			}

			for (var i = 0; i < sheet.cssRules.length; i++) {
		    	var rule = sheet.cssRules[i];
		    	processRule(rule, rule.selectorText, sheet.href, media, mediaText);
			}

		}


		function processRule(rule, rule_selectorText, href, media, mediaText){

			mediaText = mediaText=='all' ? '' : mediaText;

			//console.log('rule', rule, typeof(rule) ;

			if( typeof rule_selectorText != 'undefined' ){
				// style rule
				//console.log('style rule', mediaText, rule);
				
				if(rule_selectorText.indexOf(',')>=0){
					var subrules = rule_selectorText.split(', ');
					for(var i=0;i<subrules.length;i++){
						//console.log('sub rule', subrules[i]);
						processRule(rule, subrules[i], href, media, mediaText);
					}
					return;
				}

				var elementSelectorSpecificities=SPECIFICITY.calculate(rule_selectorText);
				
				if(elementSelectorSpecificities.length>1){
					console.log('complex specificity ', rule_selectorText, rule, elementSelectorSpecificities);
				}

				//todo: save specificity for complex rules

				var elementSelectorSpecificity=elementSelectorSpecificities[0];
				elementSelectorSpecificity.values = elementSelectorSpecificity.specificity.split(',');

				var elementSelectorText = rule_selectorText;
				var ignoredPseudoElementsAndClasses = [':link', ':visited', ':active', ':hover', ':focus', '::before', '::after'];
				for(var i=0; i<ignoredPseudoElementsAndClasses.length; i++){
					var ignored = ignoredPseudoElementsAndClasses[i];
					elementSelectorText = elementSelectorText.replace(ignored,'');
				}

				if(elementSelectorText=='body') elementSelectorText = '*'; // to match body

				var elementSelectorRules = rules[elementSelectorText] || [];
				elementSelectorRules.push({ 'href' : href, 'mediaText' : mediaText, 'rule': rule, specificity: elementSelectorSpecificity, order: rulesCount++});
				rules[elementSelectorText] = elementSelectorRules;

				//console.log('style rule', elementSelectorText, href, mediaText, rule_selectorText);

				return;
			}

			// font-face don't has rule.media therefore should be skipped for now
			// todo: define list of global rules, fonts should be added there automatically
			
			if( rule.type == 5){ //'CSSFontFaceRule'
				console.log('global font-face rule ',rule);
				globalCss += (rule.cssText +'\r\n');
				return;
			}

			if( typeof(rule.media) == 'undefined'){
				console.log('missing media for ',rule );
				return;
			}

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

		function splitSelector(selector){
			//var selector = "div > p.foo ~ div:first" // ["div", " > ", "p.foo", " ~", "div:first"] 
			//console.log(selector.match(/([\>\~\+\s]+|[^\>\~\+\s]+)/ig));
			return selector.match(/([\>\~\+\s]+|[^\>\~\+\s]+)/ig);
		}

		function hasElementSelector(element,selector, fullSelector){
			
			//todo: maybe i need remember matching elements to generate alternate context-free selectors for them..

			var isElement = selector.indexOf(' ')<0 && element.matches(selector);
			
			var $childsOfParent = $(element).parent().find(selector);
			var isChild = $(element).has($childsOfParent).length>0;

			var res = isElement || isChild;

			//console.log('check selector context for element ', isElement,isChild, res, selector, '--',fullSelector,element  );	
			return res;
		}

		

		function fixSelectorSpecificity(rule, errorSelector, relation, workingSelector){
			// relation || '' because of doubleCheckElementRule error for p:hover, p.default 
			selectorsOutOfContext.push({
				original :rule, parent : errorSelector, relation: relation , child : workingSelector
			});

			return rule;
		}

		function removeLast(str,badtext) {
		    var charpos = str.lastIndexOf(badtext);
		    if (charpos<0) return str;
		    ptone = str.substring(0,charpos);
		    pttwo = str.substring(charpos+(badtext.length));
		    return (ptone+pttwo);
		}

		function doubleCheckElementRule(rootElement, element, rule, matchedSelectors, fullRule){
			
			
			if(rule.indexOf(',')>=0){

				// process combined (complex) rules
				var r = rule.split(', ');
				for(var i=0;i<r.length;i++){

					//console.log('processing one of complex rules [', r[i],']');

					try{
						doubleCheckElementRule(rootElement, element, r[i], matchedSelectors);	
					}
					catch(e){
						console.log(e);
					}
					
				}
				return rule;
				
			} 
			
			//console.log('double check ', element, rule, rules[rule]);

			var selectorParts  = splitSelector(rule);
			var parentSelector = selectorParts[0];
			var lastSelector = '';
			var lastRelation = selectorParts[1] || '';
			var errorSelector = "";
			var workingSelector = rule;
			var prevSelector = "";
			var prevRelation = "";

			if(!hasElementSelector(rootElement,parentSelector,rule)) {
				errorSelector = parentSelector;
				workingSelector = removeLast(rule,errorSelector+lastRelation);
				
				//console.log('first-->',0,rule,'---',workingSelector,'---',errorSelector,' deleted',errorSelector+selectorParts[1]);
			}else{

			}

			for(var i=1;i<selectorParts.length && errorSelector==''; i+=2){

				lastRelation = selectorParts[i];
				lastSelector = selectorParts[i+1];

				parentSelector+= (selectorParts[i] + selectorParts[i+1]);

				if(!hasElementSelector(rootElement,parentSelector,rule)){
				 errorSelector = removeLast(parentSelector,lastSelector);
				 workingSelector = rule.replace(errorSelector,''); 
				 errorSelector = removeLast(errorSelector,lastRelation);

				//console.log('next-->',i,rule,'---',workingSelector,'---',errorSelector,' deleted',errorSelector);

 				var workingSelectorWithLastSelector =  prevSelector + prevRelation + workingSelector;

				//console.log('try reverse lookup -->',workingSelectorWithLastSelector);
				 
				 // make reverse travesal instead of using just last selector
				 // todo: make reciursive travesal

				 if(hasElementSelector(rootElement,workingSelectorWithLastSelector,rule)){

				 	
				 	errorSelector = removeLast(errorSelector,prevSelector);
				 	if(i>=5) {
				 		lastRelation = selectorParts[i-4];
				 		errorSelector = removeLast(errorSelector,lastRelation); // prev relation
						
				 	}
					workingSelector = workingSelectorWithLastSelector;	
				 	//console.log('reversed-->',i,rule,'---',workingSelector,'---',errorSelector,' deleted',errorSelector);
				 }

				 
				}


				prevRelation = lastRelation;
				prevSelector = lastSelector;
			}


			if(errorSelector !==''){

				//console.log('double check error ', errorSelector, '---', workingSelector, '---', rule,'---', rules[rule], rootElement );	
				return fixSelectorSpecificity(rule, errorSelector, lastRelation, workingSelector);
			}

			return 	rule;	
		}

		function processElementRules(rootElement, element, rule, matchedSelectors){

			// skip #text nodes
			if( typeof(element.matches) == 'undefined' ) return false;

			if(element.matches(rule) ){
					//console.log('element rule', element, rule);

					var contextSafeRule = doubleCheckElementRule(rootElement, element, rule, matchedSelectors);
					matchedSelectors.push(contextSafeRule);
					return true;
			}

			if(element.hasChildNodes()){
				for(var i=0; i<element.childNodes.length;i++){
					var childElement = element.childNodes[i];
					var matched = processElementRules(rootElement, childElement, rule, matchedSelectors);
					if(matched) return true;
				}
			}

			return false;
		}

		var selectorsOutOfContext = [];		

		function processElement(element, matchedSelectors){

			selectorsOutOfContext = [];		
			//selectorsOutOfContext.push({
			//	original :'body', parent : 'body', relation: '' , child : ''
			//});
		

			//console.log('element', element);

			for(var rule in rules){
				if( rule!=''){
					//console.log('check rule for element ', element, rule);
					processElementRules(element, element, rule, matchedSelectors);
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

			return matchedRules.sort(function(a, b) {

				var aSpec = a.specificity.values;
				var bSpec = a.specificity.values;

				//console.log('compared rules by specificity ', a.rule.selectorText, a.specificity.specificity,a.order,b.rule.selectorText, b.specificity.specificity,b.order);

				for(var i=0;i<4;i++){
					var diff = (aSpec[i] - bSpec[i]);
					if(diff != 0){
						
						return diff;	
					} 
				}

				return a.order - b.order; 
			});
		}


		function getElementStylesGroupedByMediaText(element, id){

			var selectors = processElement(element,[]);
			
			//console.log('all rules matched to element', element, selectors);

			function s(selector){
				var v = SPECIFICITY.calculate(selector)[0].specificity;
				var r=v.split(',');
				return {v:v,r:r};
			}

			/*
			console.log('all selectors out of context that should be fixed:',selectorsOutOfContext);
			for(var i=0; i<selectorsOutOfContext.length;i++){
				var selector = selectorsOutOfContext[i];
				console.log(selector.original, ' => ( ', selector.parent, ' )', selector.relation ,selector.child);
				console.log(s(selector.original).v, ' => ( ', s(selector.parent).v, ' )', selector.relation , s(selector.child).v);
			}
			*/

			var elementRules = getMatchedRules(selectors);

			//console.log('all rules matched to element', element, elementRules);

			var rulesGroupedByMediaText = [];

			var current = { MediaText : '', Rules : [] };
			
			var includedRules = [];

			for(var i=0; i<elementRules.length;i++){

					var rule = elementRules[i];


					var mediaText = rule.mediaText || '';

					if(mediaText != current.MediaText) {
						if(current.Rules.length>0){
							rulesGroupedByMediaText.push(current);
						}
						current = { MediaText : mediaText, Rules : [] };
					}
					

					if( $.inArray(rule.rule, includedRules) >=0 ){
						//console.log('skip already included rule',rule.rule, includedRules);
						continue;
						
					} else{
						includedRules.push(rule.rule);
					}

					var css = rule.rule.cssText;
					//console.log('all selectors out of context that should be fixed:',selectorsOutOfContext);
					for(var j=0; j<selectorsOutOfContext.length;j++){
						var selector = selectorsOutOfContext[j];
						
						if(css.indexOf(selector.original + ' {')>=0 ||
							css.indexOf(selector.original + ',')>=0 ){
							//todo: maybe ignore relation


							// build parent based on SPECIFICITY 
							// todo: somehow handle situation when some part of specificity > 1..
							var specificity = s(selector.parent).r;

							var newContext = '';
							
							if(specificity[1]>0){ // id
								newContext = '#'+id;
							}

							if(specificity[2]>0){ // class or attr or pseudo-selectors
								newContext = newContext+'.snippet';
							}

							if(specificity[3]>0){ // class or attr or pseudo-selectors
								newContext = 'section'+newContext;
							}

							css = css.replace(selector.original, newContext+' '+selector.relation +selector.child);
							console.log('removed context for selector', selector.original, ' => ',newContext,' ', selector.relation ,selector.child);
							
						}
					}						
					current.Rules.push(css);
					
					
					//console.log('rule with media', mediaText, ',' , rule.rule.selectorText);
			}

			rulesGroupedByMediaText.push(current);

			return rulesGroupedByMediaText;
		}

		function getElementCss(element,id){

			var css = '';
			//console.log('global css',globalCss);
			css += globalCss;

			var stylesGroupedByMediaText = getElementStylesGroupedByMediaText(element,id);
			//console.log('element styles', element, stylesGroupedByMediaText);

			for(var i=0;i<stylesGroupedByMediaText.length;i++){

				var mediaText = stylesGroupedByMediaText[i].MediaText;

				var cssByMedia = stylesGroupedByMediaText[i].Rules.join('\r\n')+'\r\n';

				if(mediaText!=''){

					cssByMedia = '@media ' + mediaText + '{\r\n' + cssByMedia + '}'+'\r\n';
				}

				css += cssByMedia;
			}

			css = css.replace (/(\s+)body([\s\,]+)/ig, '$1#'+id+'$2');
			return css;
		}

		function getNewGUID () {
			var guidTemplate = 'id-xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
			var date = new Date().getTime();
			
			return guidTemplate.replace(/[xy]/g, function (c) {
				var r = (date + Math.random() * 16) % 16 | 0;
				date = Math.floor(date / 16);
				return (c == 'x' ? r : (r & 0x7 | 0x8)).toString(16);
			});
		}

		function processDocument(){

			processDocumentSheets();

		var selector = 'div.default, .JA_columns.JA_threeColumns.JA_belowQuestionBoxPane:first, .lso';//prompt("Enter an element's selector",'');
        //var selector = '#ctl00_BodyContent_pnlDualTabQBox';
        //var selector = 'form';

			var elements = $(selector);
			
			if(elements.length!=1){
				alert("element by this selector isn't unique!");
				return;
			}

			var element = elements[0];
			var id=getNewGUID(); //todo: use something more meaningful, e.g. hash(url,selector)
			var css = getElementCss(element,id);
			

			var html = '<section id="'+id+'" class="snippet">'+element.outerHTML+'</section>';

			var source = "<style>\r\n"+css+"\r\n</style>"+html;
			source = source.replace(/url\(\//ig, 'url('+document.location.origin+'/');
			source = source.replace(/src=\"\//ig, 'src="'+document.location.origin+'/');
			source = source.replace(/src=\i\//ig, 'src=\''+document.location.origin+'/');
			//source = source.replace(/\s{2,}/ig,' ');

			console.log(source);
			
			
			if(document.location.href.indexOf('.dev.')>0){
				var iframe = document.createElement('iframe');
				var html = '<body>Foo</body>';
				document.body.appendChild(iframe);
				iframe.contentWindow.document.open();
				iframe.contentWindow.document.write(source);
				iframe.contentWindow.document.close();
			}
			else{
				document.body.innerText = source;
			}			
		}

	$(document).ready(function(){
		window.setTimeout(processDocument,1000);
	});
