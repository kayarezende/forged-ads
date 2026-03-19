-- ============================================================
-- ForgedAds — Template Seed Data
-- ============================================================

INSERT INTO public.templates (name, description, category, content_type, aspect_ratio, prompt_template, variables, sort_order)
VALUES
  (
    'Product Showcase',
    'Clean, professional product photo on a styled background',
    'product_showcase',
    'image',
    '1:1',
    'Professional e-commerce product photo of {{product_name}}. {{style}} background. Studio lighting, high detail, commercial photography style. Product centered and prominent. {{extra_details}}',
    '[{"name":"product_name","label":"Product Name","type":"text","default":""},{"name":"style","label":"Background Style","type":"select","options":["Minimalist white","Gradient pastel","Natural wood surface","Marble texture","Dark moody"],"default":"Minimalist white"},{"name":"extra_details","label":"Additional Details","type":"text","default":""}]',
    1
  ),
  (
    'Flash Sale Banner',
    'Bold sale banner with urgency-driven design',
    'sale_banner',
    'image',
    '16:9',
    'Eye-catching e-commerce sale banner for {{sale_type}}. Bold typography showing "{{headline}}". {{color_scheme}} color scheme. Dynamic composition with energy and urgency. Clean, modern retail advertising style. {{extra_details}}',
    '[{"name":"sale_type","label":"Sale Type","type":"select","options":["Flash Sale","Clearance","Seasonal Sale","Buy One Get One","Limited Time Offer"],"default":"Flash Sale"},{"name":"headline","label":"Headline Text","type":"text","default":"UP TO 50% OFF"},{"name":"color_scheme","label":"Color Scheme","type":"select","options":["Red and white","Black and gold","Blue and yellow","Green and white","Purple and pink"],"default":"Red and white"},{"name":"extra_details","label":"Additional Details","type":"text","default":""}]',
    2
  ),
  (
    'Lifestyle Scene',
    'Product in a natural, aspirational lifestyle setting',
    'lifestyle',
    'image',
    '4:5',
    'Lifestyle photography of {{product_type}} in a {{setting}} setting. Natural lighting, warm tones. Aspirational and authentic feel. {{mood}} mood. Shot on professional camera with shallow depth of field. {{extra_details}}',
    '[{"name":"product_type","label":"Product Type","type":"text","default":""},{"name":"setting","label":"Setting","type":"select","options":["Modern apartment","Outdoor cafe","Beach sunset","Cozy home","Urban rooftop","Kitchen counter"],"default":"Modern apartment"},{"name":"mood","label":"Mood","type":"select","options":["Relaxed and warm","Energetic and vibrant","Elegant and sophisticated","Playful and fun","Calm and serene"],"default":"Relaxed and warm"},{"name":"extra_details","label":"Additional Details","type":"text","default":""}]',
    3
  ),
  (
    'Instagram Post',
    'Square social media post optimized for engagement',
    'social_post',
    'image',
    '1:1',
    'Instagram-ready social media post for {{brand_or_product}}. {{visual_style}} visual style. {{content_focus}}. Eye-catching, scroll-stopping design. Modern social media aesthetic. {{extra_details}}',
    '[{"name":"brand_or_product","label":"Brand or Product","type":"text","default":""},{"name":"visual_style","label":"Visual Style","type":"select","options":["Flat lay","Minimalist","Bold and colorful","Pastel aesthetic","Dark and moody"],"default":"Flat lay"},{"name":"content_focus","label":"Content Focus","type":"select","options":["Product feature","Customer testimonial","Behind the scenes","New arrival announcement","Tips and how-to"],"default":"Product feature"},{"name":"extra_details","label":"Additional Details","type":"text","default":""}]',
    4
  ),
  (
    'Discount Announcement',
    'Clean promotional graphic highlighting a specific offer',
    'sale_banner',
    'image',
    '1:1',
    'Clean promotional graphic announcing {{discount_amount}} discount on {{product_category}}. {{design_style}} design. Clear call-to-action. Professional e-commerce promotional material. Promo code "{{promo_code}}" displayed prominently. {{extra_details}}',
    '[{"name":"discount_amount","label":"Discount Amount","type":"text","default":"20%"},{"name":"product_category","label":"Product Category","type":"text","default":""},{"name":"design_style","label":"Design Style","type":"select","options":["Modern minimal","Retro vintage","Luxury premium","Playful casual","Corporate clean"],"default":"Modern minimal"},{"name":"promo_code","label":"Promo Code","type":"text","default":"SAVE20"},{"name":"extra_details","label":"Additional Details","type":"text","default":""}]',
    5
  ),
  (
    'Hero Banner',
    'Wide hero image for website headers and landing pages',
    'product_showcase',
    'image',
    '16:9',
    'Wide hero banner for e-commerce website featuring {{product_or_theme}}. {{atmosphere}} atmosphere. Cinematic composition with space for text overlay on the {{text_side}} side. High-end commercial photography style. {{extra_details}}',
    '[{"name":"product_or_theme","label":"Product or Theme","type":"text","default":""},{"name":"atmosphere","label":"Atmosphere","type":"select","options":["Bright and airy","Warm and inviting","Cool and modern","Dark and dramatic","Soft and dreamy"],"default":"Bright and airy"},{"name":"text_side","label":"Text Placement Side","type":"select","options":["left","right"],"default":"left"},{"name":"extra_details","label":"Additional Details","type":"text","default":""}]',
    6
  ),
  (
    'Product Comparison',
    'Side-by-side product comparison layout',
    'product_showcase',
    'image',
    '16:9',
    'Side-by-side product comparison image showing {{product_a}} versus {{product_b}}. Clean {{background}} background. Professional product photography with consistent lighting. Clear visual distinction between both products. {{extra_details}}',
    '[{"name":"product_a","label":"Product A","type":"text","default":""},{"name":"product_b","label":"Product B","type":"text","default":""},{"name":"background","label":"Background","type":"select","options":["Pure white","Light gray","Gradient","Split tone"],"default":"Pure white"},{"name":"extra_details","label":"Additional Details","type":"text","default":""}]',
    7
  ),
  (
    'Testimonial Card',
    'Visual testimonial card with quote styling',
    'social_post',
    'image',
    '1:1',
    'Elegant testimonial card design with quote: "{{quote}}". {{design_theme}} theme. Customer name: {{customer_name}}. Star rating: {{rating}} stars. Professional, trustworthy e-commerce review aesthetic. {{extra_details}}',
    '[{"name":"quote","label":"Customer Quote","type":"text","default":"Amazing product, exceeded my expectations!"},{"name":"customer_name","label":"Customer Name","type":"text","default":"Happy Customer"},{"name":"rating","label":"Star Rating","type":"select","options":["5","4","3"],"default":"5"},{"name":"design_theme","label":"Design Theme","type":"select","options":["Light and clean","Dark and elegant","Warm and friendly","Bold and modern"],"default":"Light and clean"},{"name":"extra_details","label":"Additional Details","type":"text","default":""}]',
    8
  ),
  (
    'Story Ad',
    'Vertical story format for Instagram and TikTok ads',
    'social_post',
    'image',
    '9:16',
    'Vertical story-format ad for {{product_or_brand}}. {{visual_approach}} visual approach. Optimized for mobile viewing. {{call_to_action}} call-to-action feel. Trendy, engaging social media advertising style. {{extra_details}}',
    '[{"name":"product_or_brand","label":"Product or Brand","type":"text","default":""},{"name":"visual_approach","label":"Visual Approach","type":"select","options":["Full-bleed photo","Text-heavy graphic","Split layout","Product close-up","Lifestyle action shot"],"default":"Full-bleed photo"},{"name":"call_to_action","label":"Call to Action","type":"select","options":["Shop Now","Learn More","Swipe Up","Limited Time","New Arrival"],"default":"Shop Now"},{"name":"extra_details","label":"Additional Details","type":"text","default":""}]',
    9
  ),
  (
    'Seasonal Campaign',
    'Themed seasonal promotional creative',
    'lifestyle',
    'image',
    '1:1',
    '{{season}} seasonal campaign image for {{product_type}}. {{aesthetic}} aesthetic. Seasonal elements like {{seasonal_elements}}. Warm, inviting commercial photography. Suitable for e-commerce homepage and email campaigns. {{extra_details}}',
    '[{"name":"season","label":"Season","type":"select","options":["Spring","Summer","Fall","Winter","Holiday"],"default":"Spring"},{"name":"product_type","label":"Product Type","type":"text","default":""},{"name":"aesthetic","label":"Aesthetic","type":"select","options":["Cozy and warm","Fresh and vibrant","Elegant and festive","Natural and organic","Luxurious and refined"],"default":"Cozy and warm"},{"name":"seasonal_elements","label":"Seasonal Elements","type":"text","default":"flowers, soft light"},{"name":"extra_details","label":"Additional Details","type":"text","default":""}]',
    10
  );
