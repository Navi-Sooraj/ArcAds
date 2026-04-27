import models from '../models/index.js';

export const getLandingStats = async (req, res) => {
  try {
    const adSpacesCount = await models.AdSpace.count();
    
    const advertisersCount = await models.User.count({ 
      where: { role: 'advertiser' } 
    });
    
    const citiesCount = await models.AdSpace.count({
      col: 'city',
      distinct: true,
    });

    res.json({
      success: true,
      data: {
        adSpaces: adSpacesCount,
        advertisers: advertisersCount,
        cities: citiesCount,
      }
    });
  } catch (error) {
    console.error('Error fetching landing stats:', error);
    res.status(500).json({ success: false, message: 'Server error fetching stats.' });
  }
};
