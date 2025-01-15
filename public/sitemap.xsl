<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0" 
                xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
                xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9">
  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html xmlns="http://www.w3.org/1999/xhtml">
      <head>
        <title>XML Sitemap</title>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <style type="text/css">
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
            color: #333;
            max-width: 75em;
            margin: 0 auto;
            padding: 2em;
          }
          h1 {
            color: #1a1a1a;
            text-align: center;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 2em 0;
          }
          th, td {
            padding: 1em;
            text-align: left;
            border-bottom: 1px solid #eee;
          }
          th {
            background-color: #f8f9fa;
            color: #666;
            font-weight: 500;
          }
          tr:hover {
            background-color: #f5f5f5;
          }
          a {
            color: #0066cc;
            text-decoration: none;
          }
          a:hover {
            text-decoration: underline;
          }
          .url {
            max-width: 400px;
            word-break: break-all;
          }
          .lastmod {
            width: 200px;
          }
          .priority {
            width: 100px;
            text-align: center;
          }
          .changefreq {
            width: 100px;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <h1>XML Sitemap</h1>
        <xsl:choose>
          <xsl:when test="//sitemap:url">
            <!-- This is a regular sitemap -->
            <table>
              <tr>
                <th>URL</th>
                <th>Last Modified</th>
                <th>Change Frequency</th>
                <th>Priority</th>
              </tr>
              <xsl:for-each select="//sitemap:url">
                <tr>
                  <td class="url">
                    <a href="{sitemap:loc}"><xsl:value-of select="sitemap:loc"/></a>
                  </td>
                  <td class="lastmod">
                    <xsl:value-of select="sitemap:lastmod"/>
                  </td>
                  <td class="changefreq">
                    <xsl:value-of select="sitemap:changefreq"/>
                  </td>
                  <td class="priority">
                    <xsl:value-of select="sitemap:priority"/>
                  </td>
                </tr>
              </xsl:for-each>
            </table>
          </xsl:when>
          <xsl:otherwise>
            <!-- This is a sitemap index -->
            <table>
              <tr>
                <th>URL</th>
                <th>Last Modified</th>
              </tr>
              <xsl:for-each select="sitemap:sitemapindex/sitemap:sitemap">
                <tr>
                  <td class="url">
                    <a href="{sitemap:loc}"><xsl:value-of select="sitemap:loc"/></a>
                  </td>
                  <td class="lastmod">
                    <xsl:value-of select="sitemap:lastmod"/>
                  </td>
                </tr>
              </xsl:for-each>
            </table>
          </xsl:otherwise>
        </xsl:choose>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>