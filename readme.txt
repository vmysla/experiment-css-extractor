too many browser's styles
http://stackoverflow.com/questions/4911338/tools-to-selectively-copy-htmlcssjs-from-existing-sites
http://benalman.com/code/test/jquery-run-code-bookmarklet/?name=Run%20jQuery%20Code&ver=1.3.2&code=var%20elementId%20=%20prompt%28%22Enter%20an%20element%27s%20ID%22%29;%0D%0Avar%20el%20=%20document.querySelector%28%22%22%20%2b%20elementId%29;%0D%0Avar%20els%20=%20el.getElementsByTagName%28%22%2a%22%29;%0D%0A%0D%0Afor%28var%20i%20=%20-1,%20l%20=%20els.length;%20%2b%2bi%20%3C%20l;%29%7B%0D%0A%0D%0A%20%20%20%20els%5Bi%5D.setAttribute%28%22style%22,%20window.getComputedStyle%28els%5Bi%5D%29.cssText%29;%0D%0A%0D%0A%7D

same as above
https://github.com/kdzwinel/SnappySnippet

cool:
http://stackoverflow.com/a/19130994/2361743

media rules screen size
http://stackoverflow.com/questions/11429568/to-get-the-right-media-queries-to-cover-phones-tables-and-regular-screens-for-t



TODO:
- fonts, keyframes, etc?
- remove duplicated rules
- fo through rules vs elements OR remember order