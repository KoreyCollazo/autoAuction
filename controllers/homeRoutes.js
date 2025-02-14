const router = require('express').Router();
const { Bid, Listing, User } = require('../models');
const withAuth = require('../utils/auth');
const filterListingsByEndDate = require('../utils/filterListings')

router.get('/', async (req, res) => {
  try {
    // Get all listings
    const listingData = await Listing.findAll({
      include: [
        {
          model: Bid,
          attributes: ['amount'],
        },
      ],
    });
    // Serialize data so the template can read it
    const unfilteredListings = listingData.map((listing) => listing.get({ plain: true }));
    // Pass serialized data and session flag into template
    let listings = filterListingsByEndDate(unfilteredListings);
    console.log(listings)
    res.render('homepage', {
      listings,
      logged_in: req.session.logged_in,
    });
  } catch (err) {
    res.status(500).json(err);
  }
});

// Use withAuth middleware to prevent access to route
router.get('/profile', withAuth, async (req, res) => {
  try {
    // Find the logged in user based on the session ID
    const userData = await User.findByPk(req.session.user_id, {
      attributes: { exclude: ['password'] },
      include: [
        {
          model: Bid,
          include: [
            {
              model: Listing,
              attributes: ['name', 'make', 'endListingDate'],
            },
          ],
        },
        {
          model: Listing,
          attributes: [
            'name',
            'make',
            'startBidAmount',
            'endListingDate',
            'id',
          ],
          include: [
            {
              model: Bid,
              attributes: ['amount'],
            },
          ],
        },
      ],
    });
    const user = userData.get({ plain: true });
    res.render('profile', {
      ...user,
      logged_in: true,
    });
  } catch (err) {
    res.status(500).json(err);
  }
});

router.get('/login', (req, res) => {
  // If the user is already logged in, redirect the request to another route
  if (req.session.logged_in) {
    res.redirect('/profile');
    return;
  }
  res.render('login');
});
// direct to about page
router.get('/about', (req, res) => {
  res.render('about');
});

module.exports = router;
