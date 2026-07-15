<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    protected $guarded = [];
    
    public function category() {
        return $this->belongsTo(Category::class);
    }

    public function unitConversions() {
        return $this->hasMany(UnitConversion::class);
    }

    public function recipes() {
        return $this->hasMany(Recipe::class);
    }
}
