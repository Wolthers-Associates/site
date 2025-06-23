# Global Cross-Site Search Implementation

## Overview
The website now has a comprehensive global search system that allows users to search across all pages from any page on the site.

## How It Works

### 1. **Cross-Page Search Capability**
- Search from any page (index.html, team.html, journal.html, etc.)
- Results include content from ALL pages, not just the current one
- Results are organized by relevance with current page results prioritized

### 2. **Search Sources**
The system searches across:
- **Main Website Pages:**
  - `index.html` - Home page (services, about, locations, etc.)
  - `team.html` - Team page (all team members and their roles)
  - `journal.html` - Coffee journal entries

- **Trips Section:**
  - `trips/index.html` - Trip overview page
  - `trips/accounts.html` - Partner accounts page
  - `trips/trip-pages/brazil-coffee-origins-tour.html` - Specific trip details

### 3. **Smart Content Indexing**
- **Current Page**: Uses live DOM content for the most accurate, up-to-date results
- **Other Pages**: Uses comprehensive static content indexes with key terms and phrases
- **Dynamic Content**: Automatically extracts content from team member descriptions, service cards, locations, etc.

### 4. **Search Features**

#### **Real-time Search Feedback**
- Visual border color changes when results are available
- Instant feedback as you type (after 2+ characters)

#### **Intelligent Results Display**
- **Current Page Results**: Shown first with "View on this page" action
- **Other Page Results**: Include direct links to visit those pages
- **Relevance Scoring**: Shows number of matches found
- **Content Snippets**: Highlights matching terms in context

#### **Advanced Search Logic**
- **Exact Phrase Matching**: Higher relevance for exact query matches
- **Individual Word Matching**: Finds results even if not all words match
- **Weighted Results**: Current page content gets higher relevance scores
- **Multiple Match Counting**: Pages with more occurrences rank higher

### 5. **User Experience**

#### **Search Interface**
- Works with both header and footer search boxes
- Responsive overlay with clean, professional design
- Easy-to-close with Escape key or clicking outside
- Mobile-optimized for all screen sizes

#### **Results Presentation**
- Clear page titles and descriptions
- Highlighted search terms in snippets
- Visual distinction between current page and other page results
- Clean action buttons for navigation

### 6. **Example Searches**

Try searching for:
- **"Rasmus"** - Find CEO information across team and about pages
- **"Quality Control"** - Discover services, team members, and locations
- **"Brazil"** - See team members, locations, and trip information
- **"Santos"** - Find office location and team members
- **"Coffee"** - Get comprehensive results across all content
- **"Nespresso"** - Find AAA team and related information

### 7. **Technical Implementation**

#### **Files Added/Modified:**
- `js/global-search.js` - New comprehensive search utility
- `index.html` - Added global search script
- `team.html` - Added global search script  
- `journal.html` - Added global search script

#### **Key Features:**
- Class-based architecture for maintainability
- Extensible page definitions for future content
- Responsive CSS with smooth animations
- Keyboard navigation support
- Memory-efficient search algorithms

### 8. **Future Extensibility**

To add new pages to search:
1. Add page definition to `sitePages` array in `global-search.js`
2. Include relevant content keywords and descriptions
3. Add the script tag to the new HTML page
4. The search will automatically include the new content

### 9. **Performance**

- **Fast Search**: Results appear instantly
- **Lightweight**: Minimal impact on page load
- **Smart Caching**: Indexes current page content dynamically
- **Optimized Results**: Limited to top 12 most relevant results

The global search system ensures users can find any information across the entire Wolthers & Associates website from any page, providing a seamless and comprehensive search experience. 