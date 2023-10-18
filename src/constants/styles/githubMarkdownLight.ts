import { css } from "@emotion/react";

export const githubMarkdownLightStyles = css`
  [data-theme="light"] .markdown-body {
    -ms-text-size-adjust: 100%;
    -webkit-text-size-adjust: 100%;
    margin: 0;
    color: black;
    background-color: #ffffff;
    font-family: "Pretendard", "-apple-system", "BlinkMacSystemFont",
      '"Segoe UI"', "Roboto", '"Helvetica Neue"', "Arial", "sans-serif",
      '"Apple Color Emoji"', '"Segoe UI Emoji"', '"Segoe UI Symbol"';
    font-size: 18px;
    line-height: 1.7;
    word-wrap: break-word;
  }

  [data-theme="light"] .markdown-body .octicon {
    display: inline-block;
    fill: currentColor;
    vertical-align: text-bottom;
  }

  [data-theme="light"] .markdown-body h1:hover .anchor .octicon-link:before,
  [data-theme="light"] .markdown-body h2:hover .anchor .octicon-link:before,
  [data-theme="light"] .markdown-body h3:hover .anchor .octicon-link:before,
  [data-theme="light"] .markdown-body h4:hover .anchor .octicon-link:before,
  [data-theme="light"] .markdown-body h5:hover .anchor .octicon-link:before,
  [data-theme="light"] .markdown-body h6:hover .anchor .octicon-link:before {
    width: 16px;
    height: 16px;
    content: " ";
    display: inline-block;
    background-color: currentColor;
    -webkit-mask-image: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' version='1.1' aria-hidden='true'><path fill-rule='evenodd' d='M7.775 3.275a.75.75 0 001.06 1.06l1.25-1.25a2 2 0 112.83 2.83l-2.5 2.5a2 2 0 01-2.83 0 .75.75 0 00-1.06 1.06 3.5 3.5 0 004.95 0l2.5-2.5a3.5 3.5 0 00-4.95-4.95l-1.25 1.25zm-4.69 9.64a2 2 0 010-2.83l2.5-2.5a2 2 0 012.83 0 .75.75 0 001.06-1.06 3.5 3.5 0 00-4.95 0l-2.5 2.5a3.5 3.5 0 004.95 4.95l1.25-1.25a.75.75 0 00-1.06-1.06l-1.25 1.25a2 2 0 01-2.83 0z'></path></svg>");
    mask-image: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' version='1.1' aria-hidden='true'><path fill-rule='evenodd' d='M7.775 3.275a.75.75 0 001.06 1.06l1.25-1.25a2 2 0 112.83 2.83l-2.5 2.5a2 2 0 01-2.83 0 .75.75 0 00-1.06 1.06 3.5 3.5 0 004.95 0l2.5-2.5a3.5 3.5 0 00-4.95-4.95l-1.25 1.25zm-4.69 9.64a2 2 0 010-2.83l2.5-2.5a2 2 0 012.83 0 .75.75 0 001.06-1.06 3.5 3.5 0 00-4.95 0l-2.5 2.5a3.5 3.5 0 004.95 4.95l1.25-1.25a.75.75 0 00-1.06-1.06l-1.25 1.25a2 2 0 01-2.83 0z'></path></svg>");
  }

  [data-theme="light"] .markdown-body details,
  [data-theme="light"] .markdown-body figcaption,
  [data-theme="light"] .markdown-body figure {
    display: block;
  }

  [data-theme="light"] .markdown-body summary {
    display: list-item;
  }

  [data-theme="light"] .markdown-body [hidden] {
    display: none !important;
  }

  [data-theme="light"] .markdown-body a {
    background-color: transparent;
    color: #0969da;
    text-decoration: none;
  }

  [data-theme="light"] .markdown-body a:active,
  [data-theme="light"] .markdown-body a:hover {
    outline-width: 0;
  }

  [data-theme="light"] .markdown-body abbr[title] {
    border-bottom: none;
    text-decoration: underline dotted;
  }

  [data-theme="light"] .markdown-body b,
  [data-theme="light"] .markdown-body strong {
    font-weight: 600;
  }

  [data-theme="light"] .markdown-body dfn {
    font-style: italic;
  }

  [data-theme="light"] .markdown-body h1 {
    margin: 0.67em 0;
    font-weight: 600;
    padding-bottom: 0.3em;
    font-size: 2em;
    border-bottom: 1px solid hsla(210, 18%, 87%, 1);
  }

  [data-theme="light"] .markdown-body mark {
    background-color: #fff8c5;
    color: #24292f;
  }

  [data-theme="light"] .markdown-body small {
    font-size: 90%;
  }

  [data-theme="light"] .markdown-body sub,
  [data-theme="light"] .markdown-body sup {
    font-size: 75%;
    line-height: 0;
    position: relative;
    vertical-align: baseline;
  }

  [data-theme="light"] .markdown-body sub {
    bottom: -0.25em;
  }

  [data-theme="light"] .markdown-body sup {
    top: -0.5em;
  }

  [data-theme="light"] .markdown-body img {
    border-style: none;
    max-width: 100%;
    box-sizing: content-box;
    background-color: #ffffff;
  }

  [data-theme="light"] .markdown-body code,
  [data-theme="light"] .markdown-body kbd,
  [data-theme="light"] .markdown-body pre,
  [data-theme="light"] .markdown-body samp {
    font-family: monospace, monospace;
    font-size: 1em;
  }

  [data-theme="light"] .markdown-body figure {
    margin: 1em 40px;
  }

  [data-theme="light"] .markdown-body hr {
    box-sizing: content-box;
    overflow: hidden;
    background: transparent;
    border-bottom: 1px solid hsla(210, 18%, 87%, 1);
    height: 0.25em;
    padding: 0;
    margin: 24px 0;
    background-color: #d0d7de;
    border: 0;
  }

  [data-theme="light"] .markdown-body input {
    font: inherit;
    margin: 0;
    overflow: visible;
    font-family: inherit;
    font-size: inherit;
    line-height: inherit;
  }

  [data-theme="light"] .markdown-body [type="button"],
  [data-theme="light"] .markdown-body [type="reset"],
  [data-theme="light"] .markdown-body [type="submit"] {
    -webkit-appearance: button;
  }

  [data-theme="light"] .markdown-body [type="button"]::-moz-focus-inner,
  [data-theme="light"] .markdown-body [type="reset"]::-moz-focus-inner,
  [data-theme="light"] .markdown-body [type="submit"]::-moz-focus-inner {
    border-style: none;
    padding: 0;
  }

  [data-theme="light"] .markdown-body [type="button"]:-moz-focusring,
  [data-theme="light"] .markdown-body [type="reset"]:-moz-focusring,
  [data-theme="light"] .markdown-body [type="submit"]:-moz-focusring {
    outline: 1px dotted ButtonText;
  }

  [data-theme="light"] .markdown-body [type="checkbox"],
  [data-theme="light"] .markdown-body [type="radio"] {
    box-sizing: border-box;
    padding: 0;
  }

  [data-theme="light"]
    .markdown-body
    [type="number"]::-webkit-inner-spin-button,
  [data-theme="light"]
    .markdown-body
    [type="number"]::-webkit-outer-spin-button {
    height: auto;
  }

  [data-theme="light"] .markdown-body [type="search"] {
    -webkit-appearance: textfield;
    outline-offset: -2px;
  }

  [data-theme="light"]
    .markdown-body
    [type="search"]::-webkit-search-cancel-button,
  [data-theme="light"]
    .markdown-body
    [type="search"]::-webkit-search-decoration {
    -webkit-appearance: none;
  }

  [data-theme="light"] .markdown-body ::-webkit-input-placeholder {
    color: inherit;
    opacity: 0.54;
  }

  [data-theme="light"] .markdown-body ::-webkit-file-upload-button {
    -webkit-appearance: button;
    font: inherit;
  }

  [data-theme="light"] .markdown-body a:hover {
    text-decoration: underline;
  }

  [data-theme="light"] .markdown-body hr::before {
    display: table;
    content: "";
  }

  [data-theme="light"] .markdown-body hr::after {
    display: table;
    clear: both;
    content: "";
  }

  [data-theme="light"] .markdown-body table {
    border-spacing: 0;
    border-collapse: collapse;
    display: block;
    width: max-content;
    max-width: 100%;
    overflow: auto;
  }

  [data-theme="light"] .markdown-body td,
  [data-theme="light"] .markdown-body th {
    padding: 0;
  }

  [data-theme="light"] .markdown-body details summary {
    cursor: pointer;
  }

  [data-theme="light"] .markdown-body details:not([open]) > *:not(summary) {
    display: none !important;
  }

  [data-theme="light"] .markdown-body kbd {
    display: inline-block;
    padding: 3px 5px;
    font: 11px ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas,
      Liberation Mono, monospace;
    line-height: 10px;
    color: #24292f;
    vertical-align: middle;
    background-color: #f6f8fa;
    border: solid 1px rgba(175, 184, 193, 0.2);
    border-bottom-color: rgba(175, 184, 193, 0.2);
    border-radius: 6px;
    box-shadow: inset 0 -1px 0 rgba(175, 184, 193, 0.2);
  }

  [data-theme="light"] .markdown-body h1,
  [data-theme="light"] .markdown-body h2,
  [data-theme="light"] .markdown-body h3,
  [data-theme="light"] .markdown-body h4,
  [data-theme="light"] .markdown-body h5,
  [data-theme="light"] .markdown-body h6 {
    margin-top: 24px;
    margin-bottom: 16px;
    font-weight: 600;
    line-height: 1.25;
  }

  [data-theme="light"] .markdown-body h2 {
    font-weight: 600;
    padding-bottom: 0.3em;
    font-size: 1.5em;
    border-bottom: 1px solid hsla(210, 18%, 87%, 1);
  }

  [data-theme="light"] .markdown-body h3 {
    font-weight: 600;
    font-size: 1.25em;
  }

  [data-theme="light"] .markdown-body h4 {
    font-weight: 600;
    font-size: 1em;
  }

  [data-theme="light"] .markdown-body h5 {
    font-weight: 600;
    font-size: 0.875em;
  }

  [data-theme="light"] .markdown-body h6 {
    font-weight: 600;
    font-size: 0.85em;
    color: #57606a;
  }

  [data-theme="light"] .markdown-body p {
    margin-top: 0;
    margin-bottom: 10px;
  }

  [data-theme="light"] .markdown-body blockquote {
    margin: 0;
    padding: 0 1em;
    color: #57606a;
    border-left: 0.25em solid #d0d7de;
  }

  [data-theme="light"] .markdown-body ul,
  [data-theme="light"] .markdown-body ol {
    margin-top: 0;
    margin-bottom: 0;
    padding-left: 2em;
  }

  [data-theme="light"] .markdown-body ol ol,
  [data-theme="light"] .markdown-body ul ol {
    list-style-type: lower-roman;
  }

  [data-theme="light"] .markdown-body ul ul ol,
  [data-theme="light"] .markdown-body ul ol ol,
  [data-theme="light"] .markdown-body ol ul ol,
  [data-theme="light"] .markdown-body ol ol ol {
    list-style-type: lower-alpha;
  }

  [data-theme="light"] .markdown-body dd {
    margin-left: 0;
  }

  [data-theme="light"] .markdown-body tt,
  [data-theme="light"] .markdown-body code {
    font-family: ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas,
      Liberation Mono, monospace;
    font-size: 12px;
  }

  [data-theme="light"] .markdown-body pre {
    margin-top: 0;
    margin-bottom: 0;
    font-family: ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas,
      Liberation Mono, monospace;
    font-size: 12px;
    word-wrap: normal;
  }

  [data-theme="light"] .markdown-body .octicon {
    display: inline-block;
    overflow: visible !important;
    vertical-align: text-bottom;
    fill: currentColor;
  }

  [data-theme="light"] .markdown-body ::placeholder {
    color: #6e7781;
    opacity: 1;
  }

  [data-theme="light"] .markdown-body input::-webkit-outer-spin-button,
  [data-theme="light"] .markdown-body input::-webkit-inner-spin-button {
    margin: 0;
    -webkit-appearance: none;
    appearance: none;
  }

  [data-theme="light"] .markdown-body .pl-c {
    color: #6e7781;
  }

  [data-theme="light"] .markdown-body .pl-c1,
  [data-theme="light"] .markdown-body .pl-s .pl-v {
    color: #0550ae;
  }

  [data-theme="light"] .markdown-body .pl-e,
  [data-theme="light"] .markdown-body .pl-en {
    color: #8250df;
  }

  [data-theme="light"] .markdown-body .pl-smi,
  [data-theme="light"] .markdown-body .pl-s .pl-s1 {
    color: #24292f;
  }

  [data-theme="light"] .markdown-body .pl-ent {
    color: #116329;
  }

  [data-theme="light"] .markdown-body .pl-k {
    color: #cf222e;
  }

  [data-theme="light"] .markdown-body .pl-s,
  [data-theme="light"] .markdown-body .pl-pds,
  [data-theme="light"] .markdown-body .pl-s .pl-pse .pl-s1,
  [data-theme="light"] .markdown-body .pl-sr,
  [data-theme="light"] .markdown-body .pl-sr .pl-cce,
  [data-theme="light"] .markdown-body .pl-sr .pl-sre,
  [data-theme="light"] .markdown-body .pl-sr .pl-sra {
    color: #0a3069;
  }

  [data-theme="light"] .markdown-body .pl-v,
  [data-theme="light"] .markdown-body .pl-smw {
    color: #953800;
  }

  [data-theme="light"] .markdown-body .pl-bu {
    color: #82071e;
  }

  [data-theme="light"] .markdown-body .pl-ii {
    color: #f6f8fa;
    background-color: #82071e;
  }

  [data-theme="light"] .markdown-body .pl-c2 {
    color: #f6f8fa;
    background-color: #cf222e;
  }

  [data-theme="light"] .markdown-body .pl-sr .pl-cce {
    font-weight: bold;
    color: #116329;
  }

  [data-theme="light"] .markdown-body .pl-ml {
    color: #3b2300;
  }

  [data-theme="light"] .markdown-body .pl-mh,
  [data-theme="light"] .markdown-body .pl-mh .pl-en,
  [data-theme="light"] .markdown-body .pl-ms {
    font-weight: bold;
    color: #0550ae;
  }

  [data-theme="light"] .markdown-body .pl-mi {
    font-style: italic;
    color: #24292f;
  }

  [data-theme="light"] .markdown-body .pl-mb {
    font-weight: bold;
    color: #24292f;
  }

  [data-theme="light"] .markdown-body .pl-md {
    color: #82071e;
    background-color: #ffebe9;
  }

  [data-theme="light"] .markdown-body .pl-mi1 {
    color: #116329;
    background-color: #dafbe1;
  }

  [data-theme="light"] .markdown-body .pl-mc {
    color: #953800;
    background-color: #ffd8b5;
  }

  [data-theme="light"] .markdown-body .pl-mi2 {
    color: #eaeef2;
    background-color: #0550ae;
  }

  [data-theme="light"] .markdown-body .pl-mdr {
    font-weight: bold;
    color: #8250df;
  }

  [data-theme="light"] .markdown-body .pl-ba {
    color: #57606a;
  }

  [data-theme="light"] .markdown-body .pl-sg {
    color: #8c959f;
  }

  [data-theme="light"] .markdown-body .pl-corl {
    text-decoration: underline;
    color: #0a3069;
  }

  [data-theme="light"] .markdown-body [data-catalyst] {
    display: block;
  }

  [data-theme="light"] .markdown-body g-emoji {
    font-family: "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
    font-size: 1em;
    font-style: normal !important;
    font-weight: 400;
    line-height: 1;
    vertical-align: -0.075em;
  }

  [data-theme="light"] .markdown-body g-emoji img {
    width: 1em;
    height: 1em;
  }

  .markdown-body::before {
    display: table;
    content: "";
  }

  .markdown-body::after {
    display: table;
    clear: both;
    content: "";
  }

  .markdown-body > *:first-child {
    margin-top: 0 !important;
  }

  .markdown-body > *:last-child {
    margin-bottom: 0 !important;
  }

  [data-theme="light"] .markdown-body a:not([href]) {
    color: inherit;
    text-decoration: none;
  }

  [data-theme="light"] .markdown-body .absent {
    color: #cf222e;
  }

  [data-theme="light"] .markdown-body .anchor {
    float: left;
    padding-right: 4px;
    margin-left: -20px;
    line-height: 1;
  }

  [data-theme="light"] .markdown-body .anchor:focus {
    outline: none;
  }

  [data-theme="light"] .markdown-body p,
  [data-theme="light"] .markdown-body blockquote,
  [data-theme="light"] .markdown-body ul,
  [data-theme="light"] .markdown-body ol,
  [data-theme="light"] .markdown-body dl,
  [data-theme="light"] .markdown-body table,
  [data-theme="light"] .markdown-body pre,
  [data-theme="light"] .markdown-body details {
    margin-top: 0;
    margin-bottom: 16px;
  }

  [data-theme="light"] .markdown-body blockquote > :first-child {
    margin-top: 0;
  }

  [data-theme="light"] .markdown-body blockquote > :last-child {
    margin-bottom: 0;
  }

  [data-theme="light"] .markdown-body sup > a::before {
    content: "[";
  }

  [data-theme="light"] .markdown-body sup > a::after {
    content: "]";
  }

  [data-theme="light"] .markdown-body h1 .octicon-link,
  [data-theme="light"] .markdown-body h2 .octicon-link,
  [data-theme="light"] .markdown-body h3 .octicon-link,
  [data-theme="light"] .markdown-body h4 .octicon-link,
  [data-theme="light"] .markdown-body h5 .octicon-link,
  [data-theme="light"] .markdown-body h6 .octicon-link {
    color: #24292f;
    vertical-align: middle;
    visibility: hidden;
  }

  [data-theme="light"] .markdown-body h1:hover .anchor,
  [data-theme="light"] .markdown-body h2:hover .anchor,
  [data-theme="light"] .markdown-body h3:hover .anchor,
  [data-theme="light"] .markdown-body h4:hover .anchor,
  [data-theme="light"] .markdown-body h5:hover .anchor,
  [data-theme="light"] .markdown-body h6:hover .anchor {
    text-decoration: none;
  }

  [data-theme="light"] .markdown-body h1:hover .anchor .octicon-link,
  [data-theme="light"] .markdown-body h2:hover .anchor .octicon-link,
  [data-theme="light"] .markdown-body h3:hover .anchor .octicon-link,
  [data-theme="light"] .markdown-body h4:hover .anchor .octicon-link,
  [data-theme="light"] .markdown-body h5:hover .anchor .octicon-link,
  [data-theme="light"] .markdown-body h6:hover .anchor .octicon-link {
    visibility: visible;
  }

  [data-theme="light"] .markdown-body h1 tt,
  [data-theme="light"] .markdown-body h1 code,
  [data-theme="light"] .markdown-body h2 tt,
  [data-theme="light"] .markdown-body h2 code,
  [data-theme="light"] .markdown-body h3 tt,
  [data-theme="light"] .markdown-body h3 code,
  [data-theme="light"] .markdown-body h4 tt,
  [data-theme="light"] .markdown-body h4 code,
  [data-theme="light"] .markdown-body h5 tt,
  [data-theme="light"] .markdown-body h5 code,
  [data-theme="light"] .markdown-body h6 tt,
  [data-theme="light"] .markdown-body h6 code {
    padding: 0 0.2em;
    font-size: inherit;
  }

  [data-theme="light"] .markdown-body ul.no-list,
  [data-theme="light"] .markdown-body ol.no-list {
    padding: 0;
    list-style-type: none;
  }

  [data-theme="light"] .markdown-body ol[type="1"] {
    list-style-type: decimal;
  }

  [data-theme="light"] .markdown-body ol[type="a"] {
    list-style-type: lower-alpha;
  }

  [data-theme="light"] .markdown-body ol[type="i"] {
    list-style-type: lower-roman;
  }

  [data-theme="light"] .markdown-body div > ol:not([type]) {
    list-style-type: decimal;
  }

  [data-theme="light"] .markdown-body ul ul,
  [data-theme="light"] .markdown-body ul ol,
  [data-theme="light"] .markdown-body ol ol,
  [data-theme="light"] .markdown-body ol ul {
    margin-top: 0;
    margin-bottom: 0;
  }

  [data-theme="light"] .markdown-body li > p {
    margin-top: 16px;
  }

  [data-theme="light"] .markdown-body li + li {
    margin-top: 0.25em;
  }

  [data-theme="light"] .markdown-body dl {
    padding: 0;
  }

  [data-theme="light"] .markdown-body dl dt {
    padding: 0;
    margin-top: 16px;
    font-size: 1em;
    font-style: italic;
    font-weight: 600;
  }

  [data-theme="light"] .markdown-body dl dd {
    padding: 0 16px;
    margin-bottom: 16px;
  }

  [data-theme="light"] .markdown-body table th {
    font-weight: 600;
  }

  [data-theme="light"] .markdown-body table th,
  [data-theme="light"] .markdown-body table td {
    padding: 6px 13px;
    border: 1px solid #d0d7de;
  }

  [data-theme="light"] .markdown-body table tr {
    background-color: #ffffff;
    border-top: 1px solid hsla(210, 18%, 87%, 1);
  }

  [data-theme="light"] .markdown-body table tr:nth-child(2n) {
    background-color: #f6f8fa;
  }

  [data-theme="light"] .markdown-body table img {
    background-color: transparent;
  }

  [data-theme="light"] .markdown-body img[align="right"] {
    padding-left: 20px;
  }

  [data-theme="light"] .markdown-body img[align="left"] {
    padding-right: 20px;
  }

  [data-theme="light"] .markdown-body .emoji {
    max-width: none;
    vertical-align: text-top;
    background-color: transparent;
  }

  [data-theme="light"] .markdown-body span.frame {
    display: block;
    overflow: hidden;
  }

  [data-theme="light"] .markdown-body span.frame > span {
    display: block;
    float: left;
    width: auto;
    padding: 7px;
    margin: 13px 0 0;
    overflow: hidden;
    border: 1px solid #d0d7de;
  }

  [data-theme="light"] .markdown-body span.frame span img {
    display: block;
    float: left;
  }

  [data-theme="light"] .markdown-body span.frame span span {
    display: block;
    padding: 5px 0 0;
    clear: both;
    color: #24292f;
  }

  [data-theme="light"] .markdown-body span.align-center {
    display: block;
    overflow: hidden;
    clear: both;
  }

  [data-theme="light"] .markdown-body span.align-center > span {
    display: block;
    margin: 13px auto 0;
    overflow: hidden;
    text-align: center;
  }

  [data-theme="light"] .markdown-body span.align-center span img {
    margin: 0 auto;
    text-align: center;
  }

  [data-theme="light"] .markdown-body span.align-right {
    display: block;
    overflow: hidden;
    clear: both;
  }

  [data-theme="light"] .markdown-body span.align-right > span {
    display: block;
    margin: 13px 0 0;
    overflow: hidden;
    text-align: right;
  }

  [data-theme="light"] .markdown-body span.align-right span img {
    margin: 0;
    text-align: right;
  }

  [data-theme="light"] .markdown-body span.float-left {
    display: block;
    float: left;
    margin-right: 13px;
    overflow: hidden;
  }

  [data-theme="light"] .markdown-body span.float-left span {
    margin: 13px 0 0;
  }

  [data-theme="light"] .markdown-body span.float-right {
    display: block;
    float: right;
    margin-left: 13px;
    overflow: hidden;
  }

  [data-theme="light"] .markdown-body span.float-right > span {
    display: block;
    margin: 13px auto 0;
    overflow: hidden;
    text-align: right;
  }

  [data-theme="light"] .markdown-body code,
  [data-theme="light"] .markdown-body tt {
    padding: 0.2em 0.4em;
    margin: 0;
    font-size: 85%;
    background-color: rgba(175, 184, 193, 0.2);
    border-radius: 6px;
  }

  [data-theme="light"] .markdown-body code br,
  [data-theme="light"] .markdown-body tt br {
    display: none;
  }

  [data-theme="light"] .markdown-body del code {
    text-decoration: inherit;
  }

  [data-theme="light"] .markdown-body pre code {
    font-size: 100%;
  }

  [data-theme="light"] .markdown-body pre > code {
    padding: 0;
    margin: 0;
    word-break: normal;
    white-space: pre;
    background: transparent;
    border: 0;
  }

  [data-theme="light"] .markdown-body .highlight {
    margin-bottom: 16px;
  }

  [data-theme="light"] .markdown-body .highlight pre {
    margin-bottom: 0;
    word-break: normal;
  }

  [data-theme="light"] .markdown-body .highlight pre,
  [data-theme="light"] .markdown-body pre {
    padding: 16px;
    overflow: auto;
    font-size: 85%;
    line-height: 1.45;
    background-color: #2b2b2b;
    border-radius: 6px;
  }

  [data-theme="light"] .markdown-body pre code,
  [data-theme="light"] .markdown-body pre tt {
    display: inline;
    max-width: auto;
    padding: 0;
    margin: 0;
    overflow: visible;
    line-height: inherit;
    word-wrap: normal;
    background-color: transparent;
    border: 0;
  }

  [data-theme="light"] .markdown-body .csv-data td,
  [data-theme="light"] .markdown-body .csv-data th {
    padding: 5px;
    overflow: hidden;
    font-size: 12px;
    line-height: 1;
    text-align: left;
    white-space: nowrap;
  }

  [data-theme="light"] .markdown-body .csv-data .blob-num {
    padding: 10px 8px 9px;
    text-align: right;
    background: #ffffff;
    border: 0;
  }

  [data-theme="light"] .markdown-body .csv-data tr {
    border-top: 0;
  }

  [data-theme="light"] .markdown-body .csv-data th {
    font-weight: 600;
    background: #f6f8fa;
    border-top: 0;
  }

  [data-theme="light"] .markdown-body .footnotes {
    font-size: 12px;
    color: #57606a;
    border-top: 1px solid #d0d7de;
  }

  [data-theme="light"] .markdown-body .footnotes ol {
    padding-left: 16px;
  }

  [data-theme="light"] .markdown-body .footnotes li {
    position: relative;
  }

  [data-theme="light"] .markdown-body .footnotes li:target::before {
    position: absolute;
    top: -8px;
    right: -8px;
    bottom: -8px;
    left: -24px;
    pointer-events: none;
    content: "";
    border: 2px solid #0969da;
    border-radius: 6px;
  }

  [data-theme="light"] .markdown-body .footnotes li:target {
    color: #24292f;
  }

  [data-theme="light"]
    .markdown-body
    .footnotes
    .data-footnote-backref
    g-emoji {
    font-family: monospace;
  }

  [data-theme="light"] .markdown-body .task-list-item {
    list-style-type: none;
  }

  [data-theme="light"] .markdown-body .task-list-item label {
    font-weight: 400;
  }

  [data-theme="light"] .markdown-body .task-list-item.enabled label {
    cursor: pointer;
  }

  [data-theme="light"] .markdown-body .task-list-item + .task-list-item {
    margin-top: 3px;
  }

  [data-theme="light"] .markdown-body .task-list-item .handle {
    display: none;
  }

  [data-theme="light"] .markdown-body .task-list-item-checkbox {
    margin: 0 0.2em 0.25em -1.6em;
    vertical-align: middle;
  }

  [data-theme="light"]
    .markdown-body
    .contains-task-list:dir(rtl)
    .task-list-item-checkbox {
    margin: 0 -1.6em 0.25em 0.2em;
  }

  [data-theme="light"] .markdown-body ::-webkit-calendar-picker-indicator {
    filter: invert(50%);
  }
`;
