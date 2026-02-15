/**
 * Complete Countries and Cities Database
 * With delivery fees management
 */

// Get countries with cities
function getCountriesWithCities() {
    const data = localStorage.getItem('countriesWithCities');
    if (data) {
        return JSON.parse(data);
    }
    
    // Default countries with major cities
    const defaultCountries = [
        {
            id: 1,
            name_en: 'Jordan',
            name_ar: 'الأردن',
            phonePrefix: '+962',
            defaultFee: 0, // Free delivery
            cities: [
                { id: 1, name_en: 'Amman', name_ar: 'عمان', fee: 0 },
                { id: 2, name_en: 'Zarqa', name_ar: 'الزرقاء', fee: 0 },
                { id: 3, name_en: 'Irbid', name_ar: 'إربد', fee: 0 },
                { id: 4, name_en: 'Aqaba', name_ar: 'العقبة', fee: 0 },
                { id: 5, name_en: 'Madaba', name_ar: 'مادبا', fee: 0 },
                { id: 6, name_en: 'Jerash', name_ar: 'جرش', fee: 0 },
                { id: 7, name_en: 'Ajloun', name_ar: 'عجلون', fee: 0 },
                { id: 8, name_en: 'Karak', name_ar: 'الكرك', fee: 0 },
                { id: 9, name_en: 'Mafraq', name_ar: 'المفرق', fee: 0 },
                { id: 10, name_en: 'Salt', name_ar: 'السلط', fee: 0 }
            ]
        },
        {
            id: 2,
            name_en: 'Saudi Arabia',
            name_ar: 'المملكة العربية السعودية',
            phonePrefix: '+966',
            defaultFee: 15,
            cities: [
                { id: 11, name_en: 'Riyadh', name_ar: 'الرياض', fee: 15 },
                { id: 12, name_en: 'Jeddah', name_ar: 'جدة', fee: 15 },
                { id: 13, name_en: 'Mecca', name_ar: 'مكة المكرمة', fee: 15 },
                { id: 14, name_en: 'Medina', name_ar: 'المدينة المنورة', fee: 15 },
                { id: 15, name_en: 'Dammam', name_ar: 'الدمام', fee: 15 },
                { id: 16, name_en: 'Khobar', name_ar: 'الخبر', fee: 15 },
                { id: 17, name_en: 'Tabuk', name_ar: 'تبوك', fee: 20 },
                { id: 18, name_en: 'Abha', name_ar: 'أبها', fee: 20 }
            ]
        },
        {
            id: 3,
            name_en: 'United Arab Emirates',
            name_ar: 'الإمارات العربية المتحدة',
            phonePrefix: '+971',
            defaultFee: 20,
            cities: [
                { id: 19, name_en: 'Dubai', name_ar: 'دبي', fee: 20 },
                { id: 20, name_en: 'Abu Dhabi', name_ar: 'أبو ظبي', fee: 20 },
                { id: 21, name_en: 'Sharjah', name_ar: 'الشارقة', fee: 20 },
                { id: 22, name_en: 'Ajman', name_ar: 'عجمان', fee: 20 },
                { id: 23, name_en: 'Ras Al Khaimah', name_ar: 'رأس الخيمة', fee: 20 },
                { id: 24, name_en: 'Fujairah', name_ar: 'الفجيرة', fee: 20 },
                { id: 25, name_en: 'Umm Al Quwain', name_ar: 'أم القيوين', fee: 20 }
            ]
        },
        {
            id: 4,
            name_en: 'Kuwait',
            name_ar: 'الكويت',
            phonePrefix: '+965',
            defaultFee: 12,
            cities: [
                { id: 26, name_en: 'Kuwait City', name_ar: 'مدينة الكويت', fee: 12 },
                { id: 27, name_en: 'Hawalli', name_ar: 'حولي', fee: 12 },
                { id: 28, name_en: 'Salmiya', name_ar: 'السالمية', fee: 12 },
                { id: 29, name_en: 'Farwaniya', name_ar: 'الفروانية', fee: 12 },
                { id: 30, name_en: 'Ahmadi', name_ar: 'الأحمدي', fee: 12 }
            ]
        },
        {
            id: 5,
            name_en: 'Qatar',
            name_ar: 'قطر',
            phonePrefix: '+974',
            defaultFee: 18,
            cities: [
                { id: 31, name_en: 'Doha', name_ar: 'الدوحة', fee: 18 },
                { id: 32, name_en: 'Al Rayyan', name_ar: 'الريان', fee: 18 },
                { id: 33, name_en: 'Al Wakrah', name_ar: 'الوكرة', fee: 18 },
                { id: 34, name_en: 'Al Khor', name_ar: 'الخور', fee: 18 }
            ]
        },
        {
            id: 6,
            name_en: 'Bahrain',
            name_ar: 'البحرين',
            phonePrefix: '+973',
            defaultFee: 10,
            cities: [
                { id: 35, name_en: 'Manama', name_ar: 'المنامة', fee: 10 },
                { id: 36, name_en: 'Muharraq', name_ar: 'المحرق', fee: 10 },
                { id: 37, name_en: 'Riffa', name_ar: 'الرفاع', fee: 10 },
                { id: 38, name_en: 'Hamad Town', name_ar: 'مدينة حمد', fee: 10 }
            ]
        },
        {
            id: 7,
            name_en: 'Oman',
            name_ar: 'عمان',
            phonePrefix: '+968',
            defaultFee: 22,
            cities: [
                { id: 39, name_en: 'Muscat', name_ar: 'مسقط', fee: 22 },
                { id: 40, name_en: 'Salalah', name_ar: 'صلالة', fee: 25 },
                { id: 41, name_en: 'Sohar', name_ar: 'صحار', fee: 22 },
                { id: 42, name_en: 'Nizwa', name_ar: 'نزوى', fee: 22 }
            ]
        },
        {
            id: 8,
            name_en: 'Lebanon',
            name_ar: 'لبنان',
            phonePrefix: '+961',
            defaultFee: 8,
            cities: [
                { id: 43, name_en: 'Beirut', name_ar: 'بيروت', fee: 8 },
                { id: 44, name_en: 'Tripoli', name_ar: 'طرابلس', fee: 8 },
                { id: 45, name_en: 'Sidon', name_ar: 'صيدا', fee: 8 },
                { id: 46, name_en: 'Tyre', name_ar: 'صور', fee: 8 }
            ]
        },
        {
            id: 9,
            name_en: 'Palestine',
            name_ar: 'فلسطين',
            phonePrefix: '+970',
            defaultFee: 5,
            cities: [
                { id: 47, name_en: 'Ramallah', name_ar: 'رام الله', fee: 5 },
                { id: 48, name_en: 'Nablus', name_ar: 'نابلس', fee: 5 },
                { id: 49, name_en: 'Hebron', name_ar: 'الخليل', fee: 5 },
                { id: 50, name_en: 'Gaza', name_ar: 'غزة', fee: 5 }
            ]
        },
        {
            id: 10,
            name_en: 'Egypt',
            name_ar: 'مصر',
            phonePrefix: '+20',
            defaultFee: 10,
            cities: [
                { id: 51, name_en: 'Cairo', name_ar: 'القاهرة', fee: 10 },
                { id: 52, name_en: 'Alexandria', name_ar: 'الإسكندرية', fee: 10 },
                { id: 53, name_en: 'Giza', name_ar: 'الجيزة', fee: 10 },
                { id: 54, name_en: 'Sharm El Sheikh', name_ar: 'شرم الشيخ', fee: 15 },
                { id: 55, name_en: 'Hurghada', name_ar: 'الغردقة', fee: 15 }
            ]
        }
    ];
    
    localStorage.setItem('countriesWithCities', JSON.stringify(defaultCountries));
    return defaultCountries;
}

// Save countries data
function saveCountriesWithCities(countries) {
    localStorage.setItem('countriesWithCities', JSON.stringify(countries));
}

// Get cities for specific country
function getCitiesByCountry(countryId) {
    const countries = getCountriesWithCities();
    const country = countries.find(c => c.id === parseInt(countryId));
    return country ? country.cities : [];
}

// Get delivery fee for city
function getDeliveryFee(countryId, cityId) {
    const cities = getCitiesByCountry(countryId);
    const city = cities.find(c => c.id === parseInt(cityId));
    return city ? city.fee : 0;
}

// Export functions
if (typeof window !== 'undefined') {
    window.getCountriesWithCities = getCountriesWithCities;
    window.saveCountriesWithCities = saveCountriesWithCities;
    window.getCitiesByCountry = getCitiesByCountry;
    window.getDeliveryFee = getDeliveryFee;
}
