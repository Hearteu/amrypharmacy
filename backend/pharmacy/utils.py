from django.forms.models import model_to_dict


def serialize(instance, fields=None, exclude=None):
    """Convert a Django model instance to a dictionary (like Supabase .data)."""
    if instance is None:
        return None
    return model_to_dict(instance, fields=fields, exclude=exclude)


def serialize_qs(queryset, fields=None, exclude=None):
    """Convert a Django queryset to a list of dictionaries."""
    return [serialize(obj, fields=fields, exclude=exclude) for obj in queryset]


def serialize_values(queryset):
    """Convert a .values() queryset to a list of dicts (already dicts)."""
    return list(queryset)
