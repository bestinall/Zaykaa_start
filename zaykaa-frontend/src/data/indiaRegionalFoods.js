const baseRegionalFoodStates = [
  {
    state: 'Maharashtra',
    belt: 'West coast favourite',
    description:
      'Maharashtra balances everyday street energy with deep, home-style comfort, so the regional spread moves from bold snack-time spice to festive sweets.',
    specialties: [
      { name: 'Vada Pav', note: 'Soft pav with crisp potato filling, garlic chutney, and fried green chilli.' },
      { name: 'Misal Pav', note: 'Sprouted curry topped with farsan for a fiery, layered breakfast bowl.' },
      { name: 'Puran Poli', note: 'Sweet lentil-stuffed flatbread served warm with ghee.' },
    ],
  },
  {
    state: 'Delhi',
    belt: 'Capital comfort',
    description:
      'Delhi plates lean indulgent and expressive, bringing together smoky tandoor notes, rich gravies, and the kind of street food people line up for.',
    specialties: [
      { name: 'Butter Chicken', note: 'Charred chicken in a silky tomato-butter gravy.' },
      { name: 'Chole Bhature', note: 'Fluffy bhature with spiced chickpeas and pickled onion.' },
      { name: 'Daulat Ki Chaat', note: 'An airy winter dessert made from whipped milk foam.' },
    ],
  },
  {
    state: 'Punjab',
    belt: 'Hearty north',
    description:
      'Punjab brings bold dairy richness, deep tandoor character, and robust breads that make the meal feel instantly generous.',
    specialties: [
      { name: 'Sarson Da Saag', note: 'Slow-cooked mustard greens finished with butter.' },
      { name: 'Amritsari Kulcha', note: 'Stuffed tandoor bread with spiced filling and chole.' },
      { name: 'Tandoori Chicken', note: 'Yoghurt-marinated chicken roasted over live heat.' },
    ],
  },
  {
    state: 'Rajasthan',
    belt: 'Desert classics',
    description:
      'Rajasthan specialises in intense spice, pantry-smart cooking, and celebration sweets built for long, flavourful meals.',
    specialties: [
      { name: 'Dal Baati Churma', note: 'Baked wheat dumplings with lentils and sweet crumbled churma.' },
      { name: 'Laal Maas', note: 'A fiery red mutton curry with signature chilli heat.' },
      { name: 'Ghevar', note: 'Honeycomb dessert soaked lightly and finished with rabri.' },
    ],
  },
  {
    state: 'Gujarat',
    belt: 'Sweet-savory west',
    description:
      'Gujarati food plays with texture and balance, giving you light snacks, seasonal vegetable feasts, and softly sweet spice profiles.',
    specialties: [
      { name: 'Dhokla', note: 'Steamed gram flour cake with mustard seed tempering.' },
      { name: 'Undhiyu', note: 'Winter vegetable medley slow-cooked with masala and herbs.' },
      { name: 'Khandvi', note: 'Silky gram flour rolls tempered with sesame and curry leaves.' },
    ],
  },
  {
    state: 'Telangana',
    belt: 'Hyderabadi depth',
    description:
      'Telangana cooking brings heat, layered aromatics, and regal rice dishes that feel built for long-form indulgence.',
    specialties: [
      { name: 'Hyderabadi Dum Biryani', note: 'Fragrant rice and masala sealed and cooked under dum.' },
      { name: 'Haleem', note: 'Slow-cooked grain and meat porridge with rich spice depth.' },
      { name: 'Double Ka Meetha', note: 'Bread pudding infused with saffron, nuts, and reduced milk.' },
    ],
  },
  {
    state: 'Karnataka',
    belt: 'Coastal and old-city blend',
    description:
      'Karnataka spans peppery coastlines and refined city staples, giving the state a menu that feels both soulful and precise.',
    specialties: [
      { name: 'Bisi Bele Bath', note: 'Rice-lentil comfort dish with vegetables and aromatic masala.' },
      { name: 'Mangalorean Ghee Roast', note: 'Deep red roast masala lifted with generous ghee.' },
      { name: 'Mysore Pak', note: 'Rich gram flour sweet with a delicate crumb.' },
    ],
  },
  {
    state: 'Kerala',
    belt: 'Spice coast',
    description:
      'Kerala food is lush with coconut, black pepper, and curry leaves, moving easily between seafood elegance and festive plantain-leaf spreads.',
    specialties: [
      { name: 'Appam and Stew', note: 'Lacy fermented appam served with fragrant coconut stew.' },
      { name: 'Prawn Moilee', note: 'Seafood simmered in a bright coconut milk gravy.' },
      { name: 'Ada Pradhaman', note: 'Jaggery-coconut dessert made with rice ada.' },
    ],
  },
  {
    state: 'Tamil Nadu',
    belt: 'Temple-town flavour',
    description:
      'Tamil Nadu builds flavour through pepper, curry leaves, and structured spice blends, with breakfast icons and Chettinad boldness sharing the table.',
    specialties: [
      { name: 'Kanchipuram Idli', note: 'Seasoned temple-style idli with pepper and ginger.' },
      { name: 'Chettinad Pepper Chicken', note: 'Roasted spices and black pepper lead the finish.' },
      { name: 'Jigarthanda', note: 'Madurai milk drink with almond gum and ice cream.' },
    ],
  },
  {
    state: 'West Bengal',
    belt: 'River and sweet house',
    description:
      'West Bengal pairs mustard-forward savouries with delicate sweets, giving the regional table a mix of sharpness, comfort, and finesse.',
    specialties: [
      { name: 'Shorshe Ilish', note: 'Hilsa in a bright mustard gravy.' },
      { name: 'Kosha Mangsho', note: 'Slow-braised mutton with caramelised spice depth.' },
      { name: 'Nolen Gur Payesh', note: 'Rice pudding perfumed with date palm jaggery.' },
    ],
  },
  {
    state: 'Jammu & Kashmir',
    belt: 'Valley warmth',
    description:
      'The valley menu layers yoghurt, fennel, saffron, and dried spice warmth into dishes that feel aromatic and slow-crafted.',
    specialties: [
      { name: 'Rogan Josh', note: 'Aromatic red mutton curry with Kashmiri chilli depth.' },
      { name: 'Kashmiri Dum Aloo', note: 'Baby potatoes simmered in yoghurt and fennel gravy.' },
      { name: 'Kahwa', note: 'Saffron-green tea poured with nuts and warming spice.' },
    ],
  },
  {
    state: 'Goa',
    belt: 'Sea-breeze table',
    description:
      'Goa leans bright, tangy, and layered, with seafood curries, vinegar-led masalas, and iconic desserts rounding out the experience.',
    specialties: [
      { name: 'Goan Fish Curry', note: 'Tangy coconut curry with gentle chilli heat.' },
      { name: 'Prawn Balchao', note: 'Sharp, spiced prawn pickle-style preparation.' },
      { name: 'Bebinca', note: 'Layered coconut dessert baked slowly to caramel richness.' },
    ],
  },
  {
    state: 'Andhra Pradesh',
    belt: 'High-heat south',
    description:
      'Andhra Pradesh is all about assertive spice, tang, and deeply savoury meals that leave a memorable afterglow.',
    specialties: [
      { name: 'Gongura Mamsam', note: 'Meat curry sharpened with sorrel leaf tang.' },
      { name: 'Pesarattu', note: 'Green gram crepe often paired with ginger chutney.' },
      { name: 'Pootharekulu', note: 'Paper-thin sweet layered with sugar and ghee.' },
    ],
  },
  {
    state: 'Odisha',
    belt: 'Coastal temple fare',
    description:
      'Odisha brings a gentler spice line, seafood comfort, and temple-rooted dishes that feel balanced and deeply regional.',
    specialties: [
      { name: 'Dalma', note: 'Lentils and vegetables cooked together with light tempering.' },
      { name: 'Chhena Poda', note: 'Caramel-baked cottage cheese dessert.' },
      { name: 'Machha Besara', note: 'Fish curry lifted with mustard paste.' },
    ],
  },
  {
    state: 'Uttar Pradesh',
    belt: 'Awadhi richness',
    description:
      'Awadhi and old-city influences make Uttar Pradesh a home for dum cooking, soft breads, and measured but luxurious spice.',
    specialties: [
      { name: 'Galouti Kebab', note: 'Melt-soft kebabs traditionally paired with ulte tawe ka paratha.' },
      { name: 'Tehri', note: 'Comfort rice dish brightened with whole spices and vegetables.' },
      { name: 'Shahi Tukda', note: 'Bread dessert finished with saffron rabri.' },
    ],
  },
  {
    state: 'Bihar',
    belt: 'Earthy grain table',
    description:
      'Bihar food stays grounded and satisfying, with roasted gram notes, smoked textures, and festival sweets that feel homemade.',
    specialties: [
      { name: 'Litti Chokha', note: 'Roasted sattu dumplings served with smoky vegetable mash.' },
      { name: 'Sattu Paratha', note: 'Stuffed flatbread with roasted gram filling and spice.' },
      { name: 'Khaja', note: 'Layered crisp sweet associated with temple towns.' },
    ],
  },
  {
    state: 'Assam',
    belt: 'Northeast freshness',
    description:
      'Assam favours clean, fresh flavours, slow greens, and regional citrus, giving the table a distinctive lightness.',
    specialties: [
      { name: 'Masor Tenga', note: 'Light sour fish curry with tomato or regional citrus.' },
      { name: 'Duck Curry', note: 'Rich duck preparation often paired with ash gourd.' },
      { name: 'Pitha', note: 'Rice-based sweet or savoury festive snack.' },
    ],
  },
  {
    state: 'Arunachal Pradesh',
    belt: 'Mountain northeast',
    description:
      'Arunachal Pradesh favours warm broths, fermented notes, bamboo shoots, and highland comfort food shaped by mountain weather.',
    specialties: [
      { name: 'Thukpa', note: 'Noodle soup layered with vegetables, meat, and warming stock.' },
      { name: 'Bamboo Shoot Pork', note: 'Slow-cooked pork sharpened with local bamboo shoot flavour.' },
      { name: 'Zan', note: 'Traditional millet-based staple served with rich curries or stews.' },
    ],
  },
  {
    state: 'Chhattisgarh',
    belt: 'Forest grain table',
    description:
      'Chhattisgarh is rooted in rice, lentils, light spices, and nourishing snacks that feel simple, regional, and quietly distinctive.',
    specialties: [
      { name: 'Farra', note: 'Steamed rice dumplings often tossed with tempering and herbs.' },
      { name: 'Chila', note: 'Savory crepe made with rice batter or lentils.' },
      { name: 'Bafauri', note: 'Steamed chana dal snack finished with coriander and chilli.' },
    ],
  },
  {
    state: 'Haryana',
    belt: 'Farmhouse north',
    description:
      'Haryana leans on hearty grains, fresh dairy, and robust home-style cooking designed to feel sustaining rather than ornate.',
    specialties: [
      { name: 'Bajra Khichri', note: 'Millet-led comfort bowl often enriched with ghee.' },
      { name: 'Kadhi Pakora', note: 'Tangy yoghurt curry with gram flour fritters.' },
      { name: 'Mithe Chawal', note: 'Sweet saffron-tinted rice cooked for festive occasions.' },
    ],
  },
  {
    state: 'Himachal Pradesh',
    belt: 'Hill feast',
    description:
      'Himachal Pradesh serves slow-cooked gravies, festive dham spreads, and wheat comforts that fit cold-weather appetites beautifully.',
    specialties: [
      { name: 'Dham', note: 'Traditional celebratory thali built around lentils, rice, and yoghurt gravies.' },
      { name: 'Siddu', note: 'Steamed stuffed bread served hot with ghee.' },
      { name: 'Chha Gosht', note: 'Yoghurt-based mutton curry with warming spice depth.' },
    ],
  },
  {
    state: 'Jharkhand',
    belt: 'Tribal-rooted comfort',
    description:
      'Jharkhand food draws on local grains, forest produce, and fried savouries that feel rustic, smoky, and deeply home-style.',
    specialties: [
      { name: 'Dhuska', note: 'Crisp fried rice-lentil bread often served with curry.' },
      { name: 'Rugra', note: 'Seasonal mushroom preparation prized for its earthy character.' },
      { name: 'Thekua', note: 'Jaggery-sweetened biscuit-like festive treat.' },
    ],
  },
  {
    state: 'Ladakh',
    belt: 'High-altitude table',
    description:
      'Ladakh leans on barley, broths, butter tea, and mountain stews built for altitude, warmth, and long winters.',
    specialties: [
      { name: 'Skyu', note: 'Hand-rolled pasta stew simmered with vegetables or meat.' },
      { name: 'Butter Tea', note: 'Salty, warming tea whisked with butter for cold climates.' },
      { name: 'Thenthuk', note: 'Pulled noodle soup with a hearty mountain broth.' },
    ],
  },
  {
    state: 'Madhya Pradesh',
    belt: 'Central India classics',
    description:
      'Madhya Pradesh mixes street-food charm with grain-rich comfort, delivering dishes that feel familiar, filling, and full of texture.',
    specialties: [
      { name: 'Poha Jalebi', note: "The state's iconic sweet-savory breakfast pairing." },
      { name: 'Bhutte Ka Kees', note: 'Grated corn sauteed gently with milk and spices.' },
      { name: 'Dal Bafla', note: 'Central Indian answer to baati, served with lentils and ghee.' },
    ],
  },
  {
    state: 'Manipur',
    belt: 'Fresh herb northeast',
    description:
      'Manipur values vibrant herbs, fermented accents, and clean, bright preparations that feel lively rather than heavy.',
    specialties: [
      { name: 'Eromba', note: 'Mashed vegetable and chilli preparation often sharpened with fermented fish.' },
      { name: 'Chamthong', note: 'Light vegetable stew built around fresh local produce.' },
      { name: 'Singju', note: 'Crisp herb-led salad with spice and texture.' },
    ],
  },
  {
    state: 'Meghalaya',
    belt: 'Smoky uplands',
    description:
      'Meghalaya food often leans smoky, meaty, and aromatic, with rice at the centre and bold fermented flavours in the mix.',
    specialties: [
      { name: 'Jadoh', note: 'Rice dish traditionally cooked with meat and spice.' },
      { name: 'Dohneiiong', note: 'Pork curry enriched with black sesame.' },
      { name: 'Tungrymbai', note: 'Fermented soybean preparation with layered savouriness.' },
    ],
  },
  {
    state: 'Mizoram',
    belt: 'Light stew kitchen',
    description:
      'Mizoram favours brothy dishes, steamed elements, and a gentle flavour line that still carries strong local identity.',
    specialties: [
      { name: 'Bai', note: 'Mixed vegetable stew often featuring greens and bamboo shoot.' },
      { name: 'Sawhchiar', note: 'Rice-and-meat comfort porridge with a soft savoury profile.' },
      { name: 'Vawksa Rep', note: 'Smoked pork preparation with local seasoning.' },
    ],
  },
  {
    state: 'Nagaland',
    belt: 'Smoked spice northeast',
    description:
      "Nagaland's table is known for smoke, fermentation, chilli heat, and bold meat dishes with unforgettable depth.",
    specialties: [
      { name: 'Smoked Pork with Bamboo Shoot', note: 'A signature Naga combination with deep umami and aroma.' },
      { name: 'Galho', note: 'Hearty rice porridge-style dish with vegetables and protein.' },
      { name: 'Axone Pork', note: 'Pork cooked with fermented soybean for a powerful savoury finish.' },
    ],
  },
  {
    state: 'Sikkim',
    belt: 'Himalayan comfort',
    description:
      'Sikkim blends Himalayan broths, fermented greens, and pork-rich mountain comfort into a gentle but distinct regional menu.',
    specialties: [
      { name: 'Phagshapa', note: 'Pork stew balanced with radish and dried chilli.' },
      { name: 'Gundruk Soup', note: 'Fermented leafy green soup with refreshing tang.' },
      { name: 'Momos', note: 'Steamed dumplings served with bright local chutney.' },
    ],
  },
  {
    state: 'Tripura',
    belt: 'Herb-bright northeast',
    description:
      'Tripura food balances fish, bamboo, herbs, and chilli in dishes that feel clean, aromatic, and highly regional.',
    specialties: [
      { name: 'Mui Borok', note: 'Traditional Tripuri meal with local fish, herbs, and vegetable dishes.' },
      { name: 'Chakhwi', note: 'Bamboo shoot and vegetable curry with regional character.' },
      { name: 'Berma Chutney', note: 'Fermented fish condiment used for sharp savoury depth.' },
    ],
  },
  {
    state: 'Uttarakhand',
    belt: 'Mountain hearth',
    description:
      'Uttarakhand brings greens, millet, and mountain-seasoned comfort dishes that feel nourishing and deeply local.',
    specialties: [
      { name: 'Kafuli', note: 'Slow-cooked leafy green curry with a silky texture.' },
      { name: 'Aloo Ke Gutke', note: 'Spiced hill potatoes finished with local tempering.' },
      { name: 'Bal Mithai', note: 'Chocolate-brown fudge sweet coated in tiny sugar pearls.' },
    ],
  },
  {
    state: 'Chandigarh',
    belt: 'Urban north plate',
    description:
      'Chandigarh reads like an urban north Indian table: polished grills, rich curries, and tandoor-led favourites with big appeal.',
    specialties: [
      { name: 'Tandoori Platter', note: 'A city-style mixed grill with strong tandoor character.' },
      { name: 'Butter Chicken', note: "A restaurant favourite that fits Chandigarh's premium dining scene." },
      { name: 'Paneer Tikka', note: 'Charred, spiced cottage cheese served with mint chutney.' },
    ],
  },
  {
    state: 'Dadra & Nagar Haveli',
    belt: 'Western tribal blend',
    description:
      'Dadra & Nagar Haveli reflects tribal, Gujarati, and Maharashtrian influences, favouring grain-led comfort and simple seasonal dishes.',
    specialties: [
      { name: 'Ubadiyu-style Vegetables', note: 'Slow-cooked mixed vegetables in an earthy spiced style.' },
      { name: 'Millet Rotla', note: 'Rustic millet flatbread paired with local sabzis.' },
      { name: 'River Fish Curry', note: 'Light regional curry built around nearby freshwater catch.' },
    ],
  },
  {
    state: 'Daman',
    belt: 'Coastal west enclave',
    description:
      'Daman leans coastal and easygoing, with seafood, coconut, and Portuguese-era influences still shaping its table.',
    specialties: [
      { name: 'Prawn Curry Rice', note: 'A bright coastal combination built for everyday comfort.' },
      { name: 'Grilled Pomfret', note: 'Simple seafood centrepiece with citrus and spice.' },
      { name: 'Coconut Jaggery Sweets', note: 'Soft sweets that echo west-coast pantry traditions.' },
    ],
  },
  {
    state: 'Diu',
    belt: 'Island coast plate',
    description:
      "Diu's food identity is tied to seafood, coastal spice, and laid-back plates shaped by Gujarati and Portuguese influence.",
    specialties: [
      { name: 'Fish Curry', note: 'Light island-style curry with tang and coastal warmth.' },
      { name: 'Prawn Fry', note: 'Quick-cooked seafood with spice crust and crisp edges.' },
      { name: 'Coconut Desserts', note: 'Sweet finishes that lean on coconut and gentle caramel notes.' },
    ],
  },
  {
    state: 'Puducherry',
    belt: 'French-Tamil coast',
    description:
      'Puducherry brings a distinct French-Tamil crossover, where seafood, sauces, and Tamil spice meet on one plate.',
    specialties: [
      { name: 'Pondicherry Fish Curry', note: 'Coastal curry with tamarind brightness and Tamil depth.' },
      { name: 'Creole Chicken', note: 'A regional Franco-Tamil favourite with rich savoury sauce.' },
      { name: 'Stuffed Crepes', note: "Cafe-friendly plates that reflect the enclave's French influence." },
    ],
  },
];

const extraRegionalSpecialtiesByState = {
  Maharashtra: [
    { name: 'Pav Bhaji', note: 'Buttered pav served with a silky, spice-forward mixed vegetable mash.' },
    { name: 'Sol Kadhi', note: 'Cooling kokum-coconut drink that rounds out rich coastal meals.' },
  ],
  Delhi: [
    { name: 'Seekh Kebab', note: 'Juicy minced kebabs charred over heat and served with mint chutney.' },
    { name: 'Kulfi Falooda', note: 'Dense kulfi layered with falooda strands, rose syrup, and nuts.' },
  ],
  Punjab: [
    { name: 'Rajma Chawal', note: 'Slow-cooked kidney beans and rice that define everyday Punjabi comfort.' },
    { name: 'Pinni', note: 'Ghee-rich winter sweet made with flour, jaggery, and nuts.' },
  ],
  Rajasthan: [
    { name: 'Ker Sangri', note: 'Desert beans and berries sauteed with spices for a deeply local side.' },
    { name: 'Mirchi Bada', note: 'Large chillies stuffed and fried into a crisp, spicy street snack.' },
  ],
  Gujarat: [
    { name: 'Thepla', note: 'Soft spiced flatbread that travels well and pairs with pickle or curd.' },
    { name: 'Fafda Jalebi', note: 'Crunchy gram flour snack balanced with syrupy jalebi on festive mornings.' },
  ],
  Telangana: [
    { name: 'Mirchi Ka Salan', note: 'Nutty, tangy chilli curry that often accompanies Hyderabadi rice dishes.' },
    { name: 'Qubani Ka Meetha', note: 'Apricot dessert finished with cream or ice cream in Hyderabadi style.' },
  ],
  Karnataka: [
    { name: 'Neer Dosa', note: 'Lacy rice crepes that pair beautifully with coastal curries.' },
    { name: 'Ragi Mudde', note: 'Finger millet dumplings served with assertive saaru or mutton curry.' },
  ],
  Kerala: [
    { name: 'Puttu Kadala', note: 'Steamed rice cylinders served with black chickpea curry and coconut.' },
    { name: 'Malabar Parotta', note: 'Layered flaky flatbread built for rich gravies and roast meats.' },
  ],
  'Tamil Nadu': [
    { name: 'Kothu Parotta', note: 'Shredded parotta tossed on the tawa with egg, salna, and aromatics.' },
    { name: 'Sambar Sadam', note: 'Temple-style rice and lentils with vegetables in a soothing sambar base.' },
  ],
  'West Bengal': [
    { name: 'Macher Jhol', note: 'Light fish curry that anchors many home-style Bengali lunches.' },
    { name: 'Luchi Aloor Dom', note: 'Puffed flour breads paired with gently spiced potato curry.' },
  ],
  'Jammu & Kashmir': [
    { name: 'Yakhni', note: 'Elegant yoghurt-based curry perfumed with fennel and dried mint.' },
    { name: 'Gushtaba', note: 'Soft mutton dumplings simmered in a rich yoghurt gravy.' },
  ],
  Goa: [
    { name: 'Chicken Cafreal', note: 'Herb-green roast with vinegar brightness and a fiery Goan finish.' },
    { name: 'Goan Xacuti', note: 'Coconut, poppy seed, and spice-roasted curry with deep body.' },
  ],
  'Andhra Pradesh': [
    { name: 'Kodi Vepudu', note: 'Spicy Andhra-style chicken fry with curry leaves and a dry masala finish.' },
    { name: 'Pulihora', note: 'Tamarind rice sharpened with peanuts, chillies, and tempering.' },
  ],
  Odisha: [
    { name: 'Pakhala Bhata', note: 'Light fermented rice meal prized for comfort and cooling balance.' },
    { name: 'Rasabali', note: 'Soft fried chhena patties soaked in thickened sweet milk.' },
  ],
  'Uttar Pradesh': [
    { name: 'Kakori Kebab', note: 'Ultra-soft kebab seasoned delicately and traditionally served with roomali roti.' },
    { name: 'Bedmi Puri', note: 'Spiced lentil puri paired with aloo sabzi in old-city breakfasts.' },
  ],
  Bihar: [
    { name: 'Champaran Mutton', note: 'Slow-cooked handi-style mutton with mustard oil and whole spices.' },
    { name: 'Malpua', note: 'Fried festive pancakes soaked lightly in syrup.' },
  ],
  Assam: [
    { name: 'Khar', note: 'Traditional alkaline preparation that begins many Assamese meals.' },
    { name: 'Aloo Pitika', note: 'Mustard-oil potato mash with herbs, chilli, and smoked simplicity.' },
  ],
  'Arunachal Pradesh': [
    { name: 'Momos', note: 'Steamed dumplings served hot with chilli paste in mountain homes and markets.' },
    { name: 'Pika Pila', note: 'Fermented bamboo shoot pickle used for heat and sharp regional depth.' },
  ],
  Chhattisgarh: [
    { name: 'Dehrori', note: 'Lentil-rice dessert fritters soaked into a festive sweet finish.' },
    { name: 'Muthia', note: 'Steamed rice flour bites often served as a simple home-style snack.' },
  ],
  Haryana: [
    { name: 'Bajra Roti', note: 'Millet flatbread served with white butter and robust village-style sides.' },
    { name: 'Hara Dhania Cholia', note: 'Fresh green chickpeas cooked simply with coriander and spice.' },
  ],
  'Himachal Pradesh': [
    { name: 'Madra', note: 'Yoghurt-based chickpea curry with the slow depth of festive dham cooking.' },
    { name: 'Babru', note: 'Stuffed Himachali bread often paired with tamarind chutney.' },
  ],
  Jharkhand: [
    { name: 'Chilka Roti', note: 'Rice and lentil roti with a rustic texture and mild savoury depth.' },
    { name: 'Pua', note: 'Sweet fried batter cakes served during celebrations and family gatherings.' },
  ],
  Ladakh: [
    { name: 'Mokthuk', note: 'Dumpling soup that blends momo comfort with a warming broth.' },
    { name: 'Khambir', note: 'Thick local bread enjoyed with butter tea or hearty stews.' },
  ],
  'Madhya Pradesh': [
    { name: 'Sabudana Khichdi', note: 'Sago pearls tossed with peanuts, potato, and lemony lift.' },
    { name: 'Mawa Bati', note: 'Rich milk-solid dessert with syrupy festive indulgence.' },
  ],
  Manipur: [
    { name: 'Kangshoi', note: 'Simple vegetable stew that highlights freshness over heavy masala.' },
    { name: 'Chak-Hao Kheer', note: 'Black rice pudding with a nutty, aromatic Manipuri identity.' },
  ],
  Meghalaya: [
    { name: 'Dohkhlieh', note: 'Pork salad with onion, chilli, and bright regional seasoning.' },
    { name: 'Pumaloi', note: 'Soft steamed rice that often anchors Khasi festive spreads.' },
  ],
  Mizoram: [
    { name: 'Koat Pitha', note: 'Banana-rice fritter snack with a crisp outside and soft centre.' },
    { name: 'Chhum Han', note: 'Light vegetable medley cooked without heavy spice, true to Mizo style.' },
  ],
  Nagaland: [
    { name: 'Anishi Curry', note: 'Smoky yam leaf preparation that carries a strong Naga signature.' },
    { name: 'Bamboo Steamed Fish', note: 'Fish steamed with bamboo and herbs for clean, intense flavour.' },
  ],
  Sikkim: [
    { name: 'Thenthuk', note: 'Hand-pulled noodle soup built for mountain weather and long evenings.' },
    { name: 'Sha Phaley', note: 'Crisp fried bread stuffed with savoury meat or vegetables.' },
  ],
  Tripura: [
    { name: 'Mosdeng Serma', note: 'Fresh tomato-chilli relish that sharpens many Tripuri meals.' },
    { name: 'Wahan Mosdeng', note: 'Pork preparation seasoned with chillies and traditional aromatics.' },
  ],
  Uttarakhand: [
    { name: 'Chainsoo', note: 'Roasted black gram curry with a deep, earthy Garhwali flavour.' },
    { name: 'Jhangora Kheer', note: 'Millet pudding that feels light, local, and mountain-rooted.' },
  ],
  Chandigarh: [
    { name: 'Dal Makhani', note: "Creamy black lentils that fit the city's rich north-Indian dining style." },
    { name: 'Chicken Tikka', note: 'Charred boneless bites served hot from the tandoor.' },
  ],
  'Dadra & Nagar Haveli': [
    { name: 'Gamthi Chicken', note: 'Village-style chicken curry with robust spice and rustic depth.' },
    { name: 'Wild Mushroom Curry', note: 'Earthy mushroom gravy inspired by local forest produce.' },
  ],
  Daman: [
    { name: 'Crab Masala', note: 'Coastal shellfish cooked in a warmly spiced west-coast gravy.' },
    { name: 'Fish Caldeirada', note: 'Portuguese-influenced seafood stew with tomato and gentle spice.' },
  ],
  Diu: [
    { name: 'Chicken Vindaloo', note: 'Tangy, chilli-led curry with a strong coastal-Portuguese imprint.' },
    { name: 'Portuguese Prawn Curry', note: 'Coconut and vinegar prawn curry with island-style richness.' },
  ],
  Puducherry: [
    { name: 'Prawn Varuval', note: 'Tamil-style prawn fry with a crisp spice coating and seaside character.' },
    { name: 'Creole Vegetable Stew', note: 'French-Tamil comfort bowl with vegetables, herbs, and mellow sauce.' },
  ],
};

export const indiaRegionalFoodStates = baseRegionalFoodStates.map((region) => ({
  ...region,
  specialties: [
    ...region.specialties,
    ...(extraRegionalSpecialtiesByState[region.state] || []),
  ],
}));
